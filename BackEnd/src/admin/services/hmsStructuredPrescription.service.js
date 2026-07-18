import HmsStructuredPrescription from '../../models/hmsStructuredPrescription.model.js';
import HmsPatient from '../../models/hmsPatient.model.js';
import HmsStaff from '../../models/hmsStaff.model.js';
import HmsAppointment from '../../models/hmsAppointment.model.js';
import PatientCareProfile from '../../models/patientCareProfile.model.js';
import PharmacyItem from '../../models/pharmacyItem.model.js';
import { ErrorMessages, PATIENT_MESSAGES } from '../../utils/constants.js';
import { getPermissionsForStaffRole, hasPermission } from '../../utils/rbac.service.js';
import {
  generatePrescriptionCode,
  computeMedicineTotalQty,
  buildIntakeInstructions,
  buildChuranCombination,
  buildChuranIntakeText,
  powderGramsFromSpoons,
} from '../../utils/prescription.util.js';
import { buildPrescriptionPdf } from '../../utils/prescriptionPdf.util.js';
import { formatAppointmentDateDisplay } from '../../utils/appointment.util.js';
import { getDefaultPharmacySpoonGrams } from '../../utils/pharmacySpoon.util.js';
import { applyStockBaseDeduction } from '../../utils/pharmacyStockDeduction.util.js';
import { getStockBaseUnits } from '../../utils/pharmacyStockUnits.util.js';
import { createLabOrderFromPrescription } from './hmsLab.service.js';

const performerFromReq = (req) => {
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

const formatPrescription = (doc) => {
  const row = doc.toObject ? doc.toObject() : { ...doc };
  return {
    _id: String(row._id),
    prescriptionCode: row.prescriptionCode,
    patientCode: row.patientCode,
    patientName: row.patientName,
    appointmentCode: row.appointmentCode || '',
    doctorStaffCode: row.doctorStaffCode || '',
    doctorName: row.doctorName || '',
    diagnosis: row.diagnosis || '',
    remarks: row.remarks || '',
    medicines: (row.medicines ?? []).map((m) => ({
      id: String(m._id),
      name: m.name,
      itemCode: m.itemCode || '',
      isManual: Boolean(m.isManual),
      packQuantity: m.packQuantity ?? 1,
      timing: m.timing ?? {},
      totalQuantity: m.totalQuantity,
      intakeInstructions: m.intakeInstructions || buildIntakeInstructions(m.timing),
    })),
    churans: (row.churans ?? []).map((c) => ({
      id: String(c._id),
      name: c.name,
      combination: c.combination || '',
      powders: (c.powders ?? []).map((p) => ({
        itemCode: p.itemCode || '',
        name: p.name,
        quantitySpoons: p.quantitySpoons ?? null,
        spoonGrams: p.spoonGrams ?? null,
        quantityGrams: p.quantityGrams,
      })),
      intakeSpoons: c.intakeSpoons ?? null,
      intakeSpoonGrams: c.intakeSpoonGrams ?? null,
      howToIntake: c.howToIntake || '',
    })),
    recommendedTests: (row.recommendedTests ?? []).map((t) => ({
      testCode: t.testCode,
      testName: t.testName,
      categoryCode: t.categoryCode || '',
      categoryName: t.categoryName || '',
    })),
    labOrderCode: row.labOrderCode || '',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    whatsappSentAt: row.whatsappSentAt ?? null,
    whatsappSentBy: row.whatsappSentBy?.name || '',
  };
};

const syncPrescriptionToTreatmentHistory = async (prescription) => {
  const care =
    (await PatientCareProfile.findOne({ patientCode: prescription.patientCode })) ??
    (await PatientCareProfile.create({
      patientCode: prescription.patientCode,
      patient: prescription.patient,
    }));

  const medNames = prescription.medicines.map((m) => m.name).filter(Boolean);
  const title = prescription.diagnosis?.trim()
    ? `Prescription — ${prescription.diagnosis.trim()}`
    : 'Prescription';

  const entry = {
    title,
    doctor: prescription.doctorName || 'Doctor',
    status: 'Completed',
    dateRange: formatAppointmentDateDisplay(new Date()),
    description: prescription.remarks?.trim() || prescription.diagnosis?.trim() || 'Prescription issued',
    medicines: medNames,
    appointmentCode: prescription.appointmentCode || '',
    sortOrder: Date.now(),
  };

  const idx = care.treatmentHistory.findIndex(
    (t) => t.appointmentCode && t.appointmentCode === prescription.appointmentCode && t.title.includes('Prescription')
  );

  if (idx >= 0) {
    Object.assign(care.treatmentHistory[idx], entry);
  } else {
    care.treatmentHistory.unshift(entry);
  }

  await care.save();
};

const normalizeChuranPowder = (powder, defaultSpoonGrams) => {
  const spoonGrams = Number(powder.spoonGrams) || defaultSpoonGrams;
  let quantitySpoons = Number(powder.quantitySpoons);
  let quantityGrams = Number(powder.quantityGrams);

  if (!Number.isFinite(quantitySpoons) || quantitySpoons <= 0) {
    if (Number.isFinite(quantityGrams) && quantityGrams > 0 && spoonGrams > 0) {
      quantitySpoons = Math.round((quantityGrams / spoonGrams) * 1000) / 1000;
    } else {
      quantitySpoons = 1;
    }
  }

  quantityGrams = powderGramsFromSpoons(quantitySpoons, spoonGrams);
  if (quantityGrams <= 0) return null;

  return {
    itemCode: powder.itemCode?.trim() || '',
    name: powder.name.trim(),
    quantitySpoons,
    spoonGrams,
    quantityGrams,
  };
};

const deductChuranPowderStock = async (powders, defaultSpoonGrams) => {
  const deductions = new Map();

  for (const powder of powders) {
    if (!powder.itemCode) continue;
    const key = powder.itemCode;
    const existing = deductions.get(key) ?? { name: powder.name, grams: 0 };
    existing.grams += powder.quantityGrams;
    deductions.set(key, existing);
  }

  for (const [itemCode, { name, grams }] of deductions) {
    const item = await PharmacyItem.findOne({ itemCode, active: true }).populate('unit', 'name');
    if (!item) throw new Error(`Powder not found: ${name}`);

    const unitName = typeof item.unit === 'object' && item.unit?.name ? item.unit.name : '';
    const stockBase = getStockBaseUnits(item, unitName);
    if (grams > stockBase) {
      throw new Error(`Insufficient stock for ${name} (need ${grams}g, have ${stockBase}g)`);
    }

    const result = applyStockBaseDeduction(item, unitName, grams);
    if (!result.ok) {
      throw new Error(`Insufficient stock for ${name}`);
    }
    await item.save();
  }
};

const assertCanCreatePrescription = async (req) => {
  if (req.accountType !== 'staff' || req.staff?.role !== 'Doctor') {
    throw new Error(ErrorMessages.ACCESS_DENIED);
  }
  const perms = await getPermissionsForStaffRole(req.staff.role);
  if (!hasPermission(perms, 'prescriptions', 'edit')) {
    throw new Error(ErrorMessages.ACCESS_DENIED);
  }
};

export const listStructuredPrescriptions = async (patientCode) => {
  const rows = await HmsStructuredPrescription.find({ patientCode }).sort({ createdAt: -1 });
  return rows.map(formatPrescription);
};

export const getStructuredPrescription = async (patientCode, prescriptionCode) => {
  const row = await HmsStructuredPrescription.findOne({ patientCode, prescriptionCode });
  if (!row) throw new Error(PATIENT_MESSAGES.PRESCRIPTION_NOT_FOUND);
  return formatPrescription(row);
};

export const createStructuredPrescription = async (patientCode, payload, req) => {
  await assertCanCreatePrescription(req);

  const patient = await HmsPatient.findOne({ patientCode, status: true });
  if (!patient) throw new Error(ErrorMessages.PATIENT_NOT_FOUND);

  let doctorName = payload.doctorName?.trim() || '';
  let doctorStaffCode = payload.doctorStaffCode?.trim() || '';

  if (payload.appointmentCode) {
    const appt = await HmsAppointment.findOne({ appointmentCode: payload.appointmentCode });
    if (appt) {
      doctorName = doctorName || appt.doctorName;
      doctorStaffCode = doctorStaffCode || appt.staffCode;
    }
  }

  if (!doctorName && req.accountType === 'staff' && req.staff?.role === 'Doctor') {
    doctorName = req.staff.name;
    doctorStaffCode = req.staff.staffCode;
  }

  const medicines = (payload.medicines ?? []).map((m) => {
    const timing = m.timing ?? {};
    const packQuantity = Number(m.packQuantity) || 1;
    const totalQuantity =
      Number(m.totalQuantity) > 0
        ? Number(m.totalQuantity)
        : computeMedicineTotalQty(packQuantity, timing);

    return {
      name: m.name.trim(),
      itemCode: m.itemCode?.trim() || '',
      isManual: Boolean(m.isManual),
      packQuantity,
      timing,
      totalQuantity,
      intakeInstructions: m.intakeInstructions?.trim() || buildIntakeInstructions(timing),
    };
  });

  if (!medicines.length && !(payload.churans?.length) && !(payload.recommendedTests?.length)) {
    throw new Error('Add at least one medicine, churan, or lab test');
  }

  const defaultSpoonGrams = await getDefaultPharmacySpoonGrams();

  const churans = (payload.churans ?? []).map((c) => {
    const powders = (c.powders ?? [])
      .map((p) => normalizeChuranPowder(p, defaultSpoonGrams))
      .filter(Boolean);

    const intakeSpoons = Number(c.intakeSpoons) || 0;
    const intakeSpoonGrams =
      Number(c.intakeSpoonGrams) || defaultSpoonGrams;
    const howToIntake =
      c.howToIntake?.trim() ||
      buildChuranIntakeText(intakeSpoons, intakeSpoonGrams, c.intakeNote);

    const combination = c.combination?.trim() || buildChuranCombination(powders);

    return {
      name: c.name.trim(),
      combination,
      powders,
      intakeSpoons: intakeSpoons > 0 ? intakeSpoons : undefined,
      intakeSpoonGrams: intakeSpoons > 0 ? intakeSpoonGrams : undefined,
      howToIntake,
    };
  });

  const allPowders = churans.flatMap((c) => c.powders ?? []);
  if (allPowders.length) {
    await deductChuranPowderStock(allPowders, defaultSpoonGrams);
  }

  const recommendedTests = (payload.recommendedTests ?? [])
    .filter((t) => t?.testCode && t?.testName)
    .map((t) => ({
      testCode: String(t.testCode).trim(),
      testName: String(t.testName).trim(),
      categoryCode: t.categoryCode?.trim() || '',
      categoryName: t.categoryName?.trim() || '',
    }));

  const row = await HmsStructuredPrescription.create({
    prescriptionCode: await generatePrescriptionCode(),
    patientCode: patient.patientCode,
    patient: patient._id,
    patientName: patient.name,
    appointmentCode: payload.appointmentCode?.trim() || '',
    doctorStaffCode,
    doctorName,
    diagnosis: payload.diagnosis?.trim() || '',
    remarks: payload.remarks?.trim() || '',
    medicines,
    churans,
    recommendedTests,
    createdBy: performerFromReq(req),
  });

  if (recommendedTests.length) {
    const labOrder = await createLabOrderFromPrescription({
      patient,
      prescription: row,
      recommendedTests,
      req,
    });
    if (labOrder) {
      row.labOrderCode = labOrder.orderCode;
      await row.save();
    }
  }

  await syncPrescriptionToTreatmentHistory(row);
  return formatPrescription(row);
};

export const generateStructuredPrescriptionPdf = async (
  patientCode,
  prescriptionCode,
  { includeCombination = false } = {}
) => {
  const prescription = await HmsStructuredPrescription.findOne({ patientCode, prescriptionCode });
  if (!prescription) throw new Error(PATIENT_MESSAGES.PRESCRIPTION_NOT_FOUND);

  const patient = await HmsPatient.findOne({ patientCode });
  const doctor = prescription.doctorStaffCode
    ? await HmsStaff.findOne({ staffCode: prescription.doctorStaffCode })
    : null;

  const buffer = await buildPrescriptionPdf({
    prescription,
    patient,
    doctor,
    includeCombination,
  });

  return {
    buffer,
    filename: `${prescriptionCode}.pdf`,
    mimeType: 'application/pdf',
  };
};
