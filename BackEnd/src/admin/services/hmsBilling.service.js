import moment from 'moment';
import HmsInvoice from '../../models/hmsInvoice.model.js';
import HmsAppointment from '../../models/hmsAppointment.model.js';
import HmsPatient from '../../models/hmsPatient.model.js';
import PharmacyItem from '../../models/pharmacyItem.model.js';
import PatientCareProfile from '../../models/patientCareProfile.model.js';
import { ErrorMessages, BILLING_MESSAGES } from '../../utils/constants.js';
import { visitTypeForAppointment } from '../../utils/consultationFees.util.js';
import { generateInvoiceCode } from '../../utils/generateInvoiceCode.js';
import { formatHmsInvoice, mapInvoiceToPatientCare } from '../../utils/formatHmsInvoice.js';
import {
  convertSaleToBase,
  getDefaultSaleUnit,
  getEffectiveItemType,
  getStockBaseUnits,
  getUnitPrice,
  saleUnitLabel,
} from '../../utils/pharmacyStockUnits.util.js';
import { getDefaultPharmacySpoonGrams, resolveSpoonGrams } from '../../utils/pharmacySpoon.util.js';

const resolvePatient = async (patientCode) => {
  const patient = await HmsPatient.findOne({ patientCode, status: true });
  if (!patient) throw new Error(ErrorMessages.PATIENT_NOT_FOUND);
  return patient;
};

const performerFromReq = (req) => {
  if (req?.accountType === 'patient') {
    return {
      type: 'admin',
      name: req.patient?.name ? `Patient — ${req.patient.name}` : 'Patient',
    };
  }
  if (req.accountType === 'admin') {
    return {
      type: 'admin',
      name: req.admin?.firstName
        ? `${req.admin.firstName} ${req.admin.lastName || ''}`.trim()
        : req.admin?.email || 'Admin',
      adminId: req.admin?._id,
    };
  }
  return {
    type: 'staff',
    name: req.staff?.name || 'Staff',
    staffCode: req.staff?.staffCode,
  };
};

const syncInvoiceToPatientCare = async (formatted) => {
  const patient = await HmsPatient.findOne({ patientCode: formatted.patientCode });
  if (!patient) return;

  const care =
    (await PatientCareProfile.findOne({ patientCode: formatted.patientCode })) ??
    (await PatientCareProfile.create({
      patientCode: formatted.patientCode,
      patient: patient._id,
    }));

  const entry = mapInvoiceToPatientCare(formatted);
  const idx = care.invoices.findIndex((i) => i.invoiceCode === formatted.invoiceCode);

  if (idx >= 0) {
    Object.assign(care.invoices[idx], entry);
  } else {
    care.invoices.unshift(entry);
  }

  await care.save();
};

export const listInvoices = async ({ status, feeType, patientCode, search } = {}) => {
  const query = {};
  if (patientCode) query.patientCode = patientCode;
  if (feeType) query.feeType = feeType;

  if (status === 'paid') query.status = 'Paid';
  else if (status === 'partial') query.status = 'Partial';
  else if (status === 'pending') {
    query.status = { $in: ['Pending', 'Partial'] };
    query.createdAt = { $gte: moment().subtract(7, 'days').toDate() };
  } else if (status === 'overdue') {
    query.status = { $in: ['Pending', 'Partial'] };
    query.createdAt = { $lt: moment().subtract(7, 'days').toDate() };
  }

  let rows = await HmsInvoice.find(query).sort({ createdAt: -1 }).limit(500);
  let formatted = rows.map(formatHmsInvoice);

  const q = search?.trim()?.toLowerCase();
  if (q) {
    formatted = formatted.filter(
      (inv) =>
        inv.invoiceCode.toLowerCase().includes(q) ||
        inv.patientName.toLowerCase().includes(q) ||
        inv.patientCode.toLowerCase().includes(q) ||
        inv.treatment.toLowerCase().includes(q)
    );
  }

  return formatted;
};

export const listInvoicesByPatient = async (patientCode) => {
  const rows = await HmsInvoice.find({ patientCode }).sort({ createdAt: -1 });
  return rows.map(formatHmsInvoice);
};

export const getInvoiceByCode = async (invoiceCode) => {
  const row = await HmsInvoice.findOne({ invoiceCode });
  if (!row) throw new Error(BILLING_MESSAGES.NOT_FOUND);
  return formatHmsInvoice(row);
};

export const getBillingStats = async () => {
  const rows = await HmsInvoice.find({}).select('amount status paymentMethod createdAt').lean();

  let totalRevenue = 0;
  let collected = 0;
  let pending = 0;
  let overdue = 0;
  let pendingCount = 0;
  let overdueCount = 0;
  const methodTotals = { Cash: 0, UPI: 0, Card: 0, 'Net Banking': 0 };

  for (const inv of rows) {
    totalRevenue += inv.amount;
    const paid = inv.status === 'Paid' ? inv.amount : Number(inv.amountPaid) || 0;
    if (inv.status === 'Paid') {
      collected += inv.amount;
      if (inv.paymentMethod && methodTotals[inv.paymentMethod] !== undefined) {
        methodTotals[inv.paymentMethod] += inv.amount;
      }
    } else if (inv.status === 'Partial') {
      collected += paid;
      pending += inv.amount - paid;
      pendingCount += 1;
    } else {
      const daysOld = moment().diff(inv.createdAt, 'days');
      if (daysOld > 7) {
        overdue += inv.amount;
        overdueCount += 1;
      } else {
        pending += inv.amount;
        pendingCount += 1;
      }
    }
  }

  const paidTotal = Object.values(methodTotals).reduce((s, v) => s + v, 0) || 1;
  const paymentMethods = [
    { id: 'pm-upi', label: 'UPI', icon: 'upi', iconClass: 'bg-violet-100 text-violet-700' },
    { id: 'pm-bank', label: 'Net Banking', icon: 'bank', iconClass: 'bg-blue-100 text-blue-700' },
    { id: 'pm-cash', label: 'Cash', icon: 'cash', iconClass: 'bg-emerald-100 text-emerald-700' },
    { id: 'pm-card', label: 'Card', icon: 'cash', iconClass: 'bg-amber-100 text-amber-700' },
  ].map((m) => {
    const key = m.label === 'UPI' ? 'UPI' : m.label === 'Net Banking' ? 'Net Banking' : m.label;
    const amount = methodTotals[key] ?? 0;
    return { ...m, percent: Math.round((amount / paidTotal) * 100) };
  });

  return {
    totalRevenue,
    collected,
    pending,
    overdue,
    pendingCount,
    overdueCount,
    invoiceCount: rows.length,
    collectionRate: totalRevenue ? Math.round((collected / totalRevenue) * 100) : 0,
    paymentMethods,
  };
};

export const syncAppointmentPaymentFromInvoice = async (invoiceCode) => {
  const invoice = await HmsInvoice.findOne({ invoiceCode }).lean();
  if (!invoice?.appointmentCode || invoice.status !== 'Paid') return null;

  const appt = await HmsAppointment.findOne({ appointmentCode: invoice.appointmentCode });
  if (!appt || appt.paymentStatus === 'paid') return appt;

  appt.paymentStatus = 'paid';
  appt.consultationInvoiceCode = invoice.invoiceCode;
  if (appt.consultationFeeExpected == null) {
    appt.consultationFeeExpected = invoice.amount;
  }
  await appt.save();
  return appt;
};

export const createBookingInvoiceForAppointment = async (appointment, consultationFee, actor) => {
  const existing = await HmsInvoice.findOne({
    appointmentCode: appointment.appointmentCode,
    feeType: 'Consultation',
  });
  if (existing) return formatHmsInvoice(existing);

  const fee = Number(consultationFee);
  if (!Number.isFinite(fee) || fee <= 0) {
    throw new Error(BILLING_MESSAGES.FEE_REQUIRED);
  }

  const visitType = visitTypeForAppointment(appointment.appointmentType);
  const label =
    visitType === 'Follow-up'
      ? `Follow-up consultation — ${appointment.doctorName}`
      : `${appointment.appointmentType} — ${appointment.doctorName}`;

  const row = await HmsInvoice.create({
    invoiceCode: await generateInvoiceCode(),
    patientCode: appointment.patientCode,
    patient: appointment.patient,
    patientName: appointment.patientName,
    feeType: 'Consultation',
    visitType,
    appointmentCode: appointment.appointmentCode,
    doctorName: appointment.doctorName,
    description: label,
    lineItems: [
      {
        description: label,
        quantity: 1,
        unitPrice: fee,
        amount: fee,
      },
    ],
    amount: fee,
    amountPaid: 0,
    status: 'Pending',
    paymentMethod: '',
    paidAt: null,
    collectedBy: null,
    createdBy: actor || { type: 'admin', name: 'System' },
  });

  const formatted = formatHmsInvoice(row);
  await syncInvoiceToPatientCare(formatted);
  return formatted;
};

export const createConsultationInvoiceFromAppointment = async (
  appointment,
  req,
  consultationFee,
  { markPaid = false, paymentMethod = '' } = {}
) => {
  const existing = await HmsInvoice.findOne({
    appointmentCode: appointment.appointmentCode,
    feeType: 'Consultation',
  });
  if (existing) {
    if (markPaid && existing.status !== 'Paid') {
      const balance = existing.amount - (Number(existing.amountPaid) || 0);
      return collectInvoicePayment(
        existing.invoiceCode,
        { amount: balance, paymentMethod: paymentMethod || 'Cash' },
        req
      );
    }
    return formatHmsInvoice(existing);
  }

  const fee = Number(consultationFee);
  if (!Number.isFinite(fee) || fee < 0) {
    throw new Error(BILLING_MESSAGES.FEE_REQUIRED);
  }

  const visitType = visitTypeForAppointment(appointment.appointmentType);
  const label =
    visitType === 'Follow-up'
      ? `Follow-up consultation — ${appointment.doctorName}`
      : `${appointment.appointmentType} — ${appointment.doctorName}`;

  const actor = req ? performerFromReq(req) : { type: 'admin', name: 'System' };
  const paidNow = markPaid === true;

  const row = await HmsInvoice.create({
    invoiceCode: await generateInvoiceCode(),
    patientCode: appointment.patientCode,
    patient: appointment.patient,
    patientName: appointment.patientName,
    feeType: 'Consultation',
    visitType,
    appointmentCode: appointment.appointmentCode,
    doctorName: appointment.doctorName,
    description: label,
    lineItems: [
      {
        description: label,
        quantity: 1,
        unitPrice: fee,
        amount: fee,
      },
    ],
    amount: fee,
    amountPaid: paidNow ? fee : 0,
    status: paidNow ? 'Paid' : 'Pending',
    paymentMethod: paidNow ? paymentMethod || 'Cash' : '',
    paidAt: paidNow ? new Date() : null,
    collectedBy: paidNow ? actor : null,
    createdBy: actor,
  });

  const formatted = formatHmsInvoice(row);
  await syncInvoiceToPatientCare(formatted);
  return formatted;
};

export const createMedicineInvoice = async (payload, req) => {
  const patient = await resolvePatient(payload.patientCode);
  const actor = performerFromReq(req);

  if (!payload.items?.length) {
    throw new Error(BILLING_MESSAGES.ITEMS_REQUIRED);
  }

  const lineItems = [];
  let total = 0;
  const defaultSpoonGrams = await getDefaultPharmacySpoonGrams();

  for (const row of payload.items) {
    const item = await PharmacyItem.findOne({ itemCode: row.itemCode, active: true }).populate(
      'unit',
      'name'
    );
    if (!item) throw new Error(BILLING_MESSAGES.ITEM_NOT_FOUND);

    const unitName =
      typeof item.unit === 'object' && item.unit?.name ? item.unit.name : '';

    const qty = Number(row.quantity);
    if (!Number.isFinite(qty) || qty <= 0) throw new Error(BILLING_MESSAGES.INVALID_QUANTITY);

    const calcItem =
      typeof item.toObject === 'function' ? item.toObject() : { ...item };
    calcItem.spoonSizeGrams = resolveSpoonGrams(calcItem, defaultSpoonGrams);

    const saleUnit =
      row.saleUnit || getDefaultSaleUnit(getEffectiveItemType(calcItem, unitName));
    const baseNeeded = convertSaleToBase(qty, saleUnit, calcItem, unitName);
    const stockBase = getStockBaseUnits(calcItem, unitName);
    if (baseNeeded > stockBase) {
      throw new Error(`${BILLING_MESSAGES.INSUFFICIENT_STOCK}: ${item.name}`);
    }

    if (
      item.expiryDate &&
      moment(item.expiryDate).startOf('day').isBefore(moment().startOf('day'))
    ) {
      throw new Error(`${BILLING_MESSAGES.ITEM_EXPIRED}: ${item.name}`);
    }

    const unitPrice = Number(row.unitPrice ?? getUnitPrice(calcItem, saleUnit, unitName) ?? 0);
    if (unitPrice <= 0) throw new Error(`${BILLING_MESSAGES.PRICE_REQUIRED}: ${item.name}`);

    const amount = Math.round(unitPrice * qty * 100) / 100;
    const unitLabel = saleUnitLabel(saleUnit, calcItem, unitName);
    lineItems.push({
      itemCode: item.itemCode,
      description: `${item.name} (${qty} ${unitLabel})`,
      quantity: qty,
      unitPrice,
      amount,
      saleUnit,
    });
    total += amount;

    const newBase = Math.max(0, Math.round((stockBase - baseNeeded) * 1000) / 1000);
    const effectiveType = getEffectiveItemType(item, unitName);
    const upp = Number(item.unitsPerPack) || Number(item.packQuantity) || 1;

    if (item.stockInBaseUnits || effectiveType !== 'unit') {
      item.stock = newBase;
      item.stockInBaseUnits = true;
      if (!item.itemType || item.itemType === 'unit') item.itemType = effectiveType;
      if (!item.unitsPerPack || item.unitsPerPack <= 1) item.unitsPerPack = upp;
    } else {
      item.stock = Math.max(0, Math.ceil(newBase));
    }
    await item.save();
  }

  const markPaid = payload.markPaid === true;
  const paymentMethod = payload.paymentMethod || '';

  const invoice = await HmsInvoice.create({
    invoiceCode: await generateInvoiceCode(),
    patientCode: patient.patientCode,
    patient: patient._id,
    patientName: patient.name,
    feeType: 'Medicine',
    visitType: '',
    description: 'Pharmacy medicines',
    lineItems,
    amount: total,
    amountPaid: markPaid ? total : 0,
    status: markPaid ? 'Paid' : 'Pending',
    paymentMethod: markPaid ? paymentMethod || 'Cash' : '',
    paidAt: markPaid ? new Date() : null,
    collectedBy: markPaid ? actor : null,
    createdBy: actor,
  });

  const formatted = formatHmsInvoice(invoice);
  await syncInvoiceToPatientCare(formatted);
  return formatted;
};

export const collectInvoicePayment = async (invoiceCode, payload, req) => {
  const row = await HmsInvoice.findOne({ invoiceCode });
  if (!row) throw new Error(BILLING_MESSAGES.NOT_FOUND);
  if (row.status === 'Paid') throw new Error(BILLING_MESSAGES.ALREADY_PAID);

  const currentPaid = Number(row.amountPaid) || 0;
  const balance = row.amount - currentPaid;
  const payAmount =
    payload.amount != null && payload.amount !== ''
      ? Number(payload.amount)
      : balance;

  if (!Number.isFinite(payAmount) || payAmount <= 0) {
    throw new Error(BILLING_MESSAGES.INVALID_PAYMENT_AMOUNT);
  }
  if (payAmount > balance) {
    throw new Error(BILLING_MESSAGES.PAYMENT_EXCEEDS_BALANCE);
  }

  const actor = performerFromReq(req);
  const newPaid = currentPaid + payAmount;
  row.amountPaid = newPaid;
  row.paymentMethod = payload.paymentMethod || 'Cash';

  if (newPaid >= row.amount) {
    row.status = 'Paid';
    row.paidAt = new Date();
    row.collectedBy = actor;
  } else {
    row.status = 'Partial';
  }

  if (row.programCode) {
    const HmsPanchakarmaProgram = (await import('../../models/hmsPanchakarmaProgram.model.js')).default;
    await HmsPanchakarmaProgram.updateOne(
      { programCode: row.programCode },
      { amountPaid: newPaid }
    );
  }

  await row.save();

  if (row.status === 'Paid' && row.appointmentCode) {
    await syncAppointmentPaymentFromInvoice(row.invoiceCode);
  }

  const formatted = formatHmsInvoice(row);
  await syncInvoiceToPatientCare(formatted);
  return formatted;
};

export const createPanchakarmaInvoice = async (program, req, { markPaid = false, paymentMethod = '', payAmount = null } = {}) => {
  const existing = await HmsInvoice.findOne({
    programCode: program.programCode,
    feeType: 'Panchakarma',
  });

  const actor = performerFromReq(req);
  const totalFees = Number(program.totalFees) || 0;
  if (totalFees <= 0) throw new Error(BILLING_MESSAGES.FEE_REQUIRED);

  const label = program.treatmentName?.trim()
    ? `Panchakarma — ${program.treatmentName}`
    : `Panchakarma — ${program.therapy}`;

  if (existing) {
    if (markPaid || payAmount) {
      const amount = payAmount != null ? Number(payAmount) : totalFees - (existing.amountPaid || 0);
      return collectInvoicePayment(existing.invoiceCode, { amount, paymentMethod }, req);
    }
    return formatHmsInvoice(existing);
  }

  const initialPay = markPaid ? totalFees : payAmount != null ? Number(payAmount) : 0;
  const paid = Math.min(totalFees, Math.max(0, initialPay));

  const row = await HmsInvoice.create({
    invoiceCode: await generateInvoiceCode(),
    patientCode: program.patientCode,
    patient: program.patient,
    patientName: program.patientName,
    feeType: 'Panchakarma',
    visitType: '',
    programCode: program.programCode,
    appointmentCode: program.appointmentCode || '',
    doctorName: program.therapistName,
    description: label,
    lineItems: [
      {
        description: label,
        quantity: 1,
        unitPrice: totalFees,
        amount: totalFees,
      },
    ],
    amount: totalFees,
    amountPaid: paid,
    status: paid >= totalFees ? 'Paid' : paid > 0 ? 'Partial' : 'Pending',
    paymentMethod: paid > 0 ? paymentMethod || 'Cash' : '',
    paidAt: paid >= totalFees ? new Date() : null,
    collectedBy: paid > 0 ? actor : null,
    createdBy: actor,
  });

  const formatted = formatHmsInvoice(row);
  await syncInvoiceToPatientCare(formatted);
  return formatted;
};
