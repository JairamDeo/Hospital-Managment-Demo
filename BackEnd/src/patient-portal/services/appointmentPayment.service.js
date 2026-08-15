import HmsAppointment from '../../models/hmsAppointment.model.js';
import HmsInvoice from '../../models/hmsInvoice.model.js';
import HmsStaff from '../../models/hmsStaff.model.js';
import { APPOINTMENT_MESSAGES, BILLING_MESSAGES } from '../../utils/constants.js';
import { formatHmsAppointment } from '../../utils/formatHmsAppointment.js';
import {
  createBookingInvoiceForAppointment,
  syncAppointmentPaymentFromInvoice,
} from '../../admin/services/hmsBilling.service.js';
import {
  createRazorpayOrderForInvoice,
  getRazorpayPublicConfig,
  verifyRazorpayPaymentForInvoice,
} from '../../admin/services/hmsBillingRazorpay.service.js';
import { isRazorpayEnabled } from '../../services/payment/razorpay.service.js';

const patientActorFromReq = (req) => ({
  type: 'admin',
  name: req.patient?.name ? `Patient — ${req.patient.name}` : 'Patient',
});

const resolveStaffConsultationFee = async (appointment) => {
  const staff = await HmsStaff.findById(appointment.staff);
  if (!staff) return 0;
  return Number(staff.consultationFee) || 0;
};

export const ensureAppointmentBookingPayment = async (appointmentDoc) => {
  if (appointmentDoc.status === 'Cancelled') {
    return appointmentDoc;
  }

  if (appointmentDoc.paymentStatus === 'paid') {
    return appointmentDoc;
  }

  if (appointmentDoc.consultationInvoiceCode) {
    const invoice = await HmsInvoice.findOne({
      invoiceCode: appointmentDoc.consultationInvoiceCode,
    });
    if (invoice?.status === 'Paid') {
      appointmentDoc.paymentStatus = 'paid';
      await appointmentDoc.save();
      return appointmentDoc;
    }
    if (invoice && appointmentDoc.paymentStatus !== 'unpaid') {
      appointmentDoc.paymentStatus = 'unpaid';
      await appointmentDoc.save();
    }
    return appointmentDoc;
  }

  const fee =
    appointmentDoc.consultationFeeExpected != null
      ? Number(appointmentDoc.consultationFeeExpected)
      : await resolveStaffConsultationFee(appointmentDoc);

  if (!Number.isFinite(fee) || fee <= 0) {
    appointmentDoc.paymentStatus = 'not_required';
    appointmentDoc.consultationFeeExpected = 0;
    await appointmentDoc.save();
    return appointmentDoc;
  }

  const invoice = await createBookingInvoiceForAppointment(
    appointmentDoc,
    fee,
    patientActorFromReq({ patient: { name: appointmentDoc.patientName } })
  );

  appointmentDoc.consultationFeeExpected = fee;
  appointmentDoc.consultationInvoiceCode = invoice.invoiceCode;
  appointmentDoc.paymentStatus = 'unpaid';
  await appointmentDoc.save();
  return appointmentDoc;
};

const loadPatientAppointment = async (appointmentCode, patientCode) => {
  const row = await HmsAppointment.findOne({ appointmentCode, patientCode });
  if (!row) throw new Error(APPOINTMENT_MESSAGES.NOT_FOUND);
  return row;
};

export const enrichPatientAppointmentsForPayment = async (patientCode) => {
  const rows = await HmsAppointment.find({ patientCode }).sort({
    appointmentDate: -1,
    timeSlot: 1,
  });

  for (const row of rows) {
    if (row.status === 'Upcoming' && row.paymentStatus !== 'paid') {
      await ensureAppointmentBookingPayment(row);
    }
  }

  const refreshed = await HmsAppointment.find({ patientCode }).sort({
    appointmentDate: -1,
    timeSlot: 1,
  });
  return refreshed.map(formatHmsAppointment);
};

export const getPatientAppointmentPaymentStatus = async (appointmentCode, patientCode) => {
  const row = await loadPatientAppointment(appointmentCode, patientCode);
  await ensureAppointmentBookingPayment(row);
  const refreshed = await HmsAppointment.findOne({ appointmentCode, patientCode });
  return {
    appointment: formatHmsAppointment(refreshed),
    razorpay: getRazorpayPublicConfig(),
  };
};

export const createPatientAppointmentRazorpayOrder = async (appointmentCode, req) => {
  if (!isRazorpayEnabled()) {
    throw new Error(BILLING_MESSAGES.RAZORPAY_NOT_CONFIGURED);
  }

  const row = await loadPatientAppointment(appointmentCode, req.patient.patientCode);
  if (row.status === 'Cancelled') throw new Error(APPOINTMENT_MESSAGES.CANCELLED_NO_PAY);
  if (row.paymentStatus === 'paid') throw new Error(APPOINTMENT_MESSAGES.ALREADY_PAID);

  await ensureAppointmentBookingPayment(row);
  const refreshed = await HmsAppointment.findOne({
    appointmentCode,
    patientCode: req.patient.patientCode,
  });

  if (refreshed.paymentStatus === 'not_required') {
    throw new Error(APPOINTMENT_MESSAGES.PAYMENT_NOT_REQUIRED);
  }
  if (!refreshed.consultationInvoiceCode) {
    throw new Error(APPOINTMENT_MESSAGES.PAYMENT_UNAVAILABLE);
  }

  const invoice = await HmsInvoice.findOne({ invoiceCode: refreshed.consultationInvoiceCode });
  if (invoice?.status === 'Paid') {
    await syncAppointmentPaymentFromInvoice(invoice.invoiceCode);
    throw new Error(APPOINTMENT_MESSAGES.ALREADY_PAID);
  }

  const patientReq = {
    accountType: 'patient',
    patient: { patientCode: req.patient.patientCode, name: req.patient.name },
  };

  const order = await createRazorpayOrderForInvoice(
    refreshed.consultationInvoiceCode,
    { appointmentCode: refreshed.appointmentCode },
    patientReq
  );

  return {
    order,
    appointment: formatHmsAppointment(refreshed),
  };
};

export const verifyPatientAppointmentRazorpayPayment = async (payload, req) => {
  const appointmentCode = payload.appointmentCode || req.params?.appointmentCode;
  const row = await loadPatientAppointment(appointmentCode, req.patient.patientCode);
  if (row.status === 'Cancelled') throw new Error(APPOINTMENT_MESSAGES.CANCELLED_NO_PAY);

  await ensureAppointmentBookingPayment(row);
  const refreshed = await HmsAppointment.findOne({
    appointmentCode,
    patientCode: req.patient.patientCode,
  });

  const invoiceCode = refreshed.consultationInvoiceCode;
  if (!invoiceCode) throw new Error(APPOINTMENT_MESSAGES.PAYMENT_UNAVAILABLE);

  const patientReq = {
    accountType: 'patient',
    patient: { patientCode: req.patient.patientCode, name: req.patient.name },
  };

  const result = await verifyRazorpayPaymentForInvoice(
    {
      invoiceCode,
      razorpayOrderId: payload.razorpayOrderId,
      razorpayPaymentId: payload.razorpayPaymentId,
      razorpaySignature: payload.razorpaySignature,
      razorpayMethod: payload.razorpayMethod,
    },
    patientReq
  );

  await syncAppointmentPaymentFromInvoice(invoiceCode);
  const updated = await HmsAppointment.findOne({
    appointmentCode,
    patientCode: req.patient.patientCode,
  });

  return {
    ...result,
    appointment: formatHmsAppointment(updated),
  };
};
