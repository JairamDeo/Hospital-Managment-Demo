import moment from 'moment';
import HmsAppointment from '../../models/hmsAppointment.model.js';
import HmsInvoice from '../../models/hmsInvoice.model.js';
import HmsPatient from '../../models/hmsPatient.model.js';
import HmsStaff from '../../models/hmsStaff.model.js';
import PatientCareProfile from '../../models/patientCareProfile.model.js';
import { ErrorMessages, APPOINTMENT_MESSAGES, BILLING_MESSAGES } from '../../utils/constants.js';
import {
  APPOINTMENT_TIME_SLOTS,
  assertValidTimeSlot,
  findDoctorSlotConflict,
  formatAppointmentDateDisplay,
  formatAppointmentDateIso,
  formatTimeDisplay,
  normalizeAppointmentDate,
} from '../../utils/appointment.util.js';
import { formatHmsAppointment } from '../../utils/formatHmsAppointment.js';
import { generateAppointmentCode } from '../../utils/generateAppointmentCode.js';
import { createConsultationInvoiceFromAppointment, createBookingInvoiceForAppointment } from './hmsBilling.service.js';

const syncAppointmentToPatientCare = async (appointment) => {
  const care =
    (await PatientCareProfile.findOne({ patientCode: appointment.patientCode })) ??
    (await PatientCareProfile.create({
      patientCode: appointment.patientCode,
      patient: appointment.patient,
    }));

  const entry = {
    appointmentCode: appointment.appointmentCode,
    date: formatAppointmentDateDisplay(appointment.appointmentDate),
    time: appointment.timeDisplay,
    type: appointment.appointmentType,
    doctor: appointment.doctorName,
    status: appointment.status === 'Cancelled' ? 'Cancelled' : 'Upcoming',
    followUpDate: appointment.followUpDate
      ? formatAppointmentDateDisplay(appointment.followUpDate)
      : '',
    followUpTime: appointment.followUpTimeDisplay || '',
    sortOrder: Date.now(),
  };

  care.appointments.unshift(entry);
  await care.save();
};

const syncCareFromAppointment = async (appointment) => {
  const care = await PatientCareProfile.findOne({ patientCode: appointment.patientCode });
  if (!care) return;

  const status =
    appointment.status === 'Cancelled'
      ? 'Cancelled'
      : appointment.status === 'Completed'
        ? 'Completed'
        : 'Upcoming';

  const patch = {
    appointmentCode: appointment.appointmentCode,
    date: formatAppointmentDateDisplay(appointment.appointmentDate),
    time: appointment.timeDisplay,
    type: appointment.appointmentType,
    doctor: appointment.doctorName,
    status,
    followUpDate: appointment.followUpDate
      ? formatAppointmentDateDisplay(appointment.followUpDate)
      : '',
    followUpTime: appointment.followUpTimeDisplay || '',
  };

  const idx = care.appointments.findIndex(
    (a) => a.appointmentCode === appointment.appointmentCode
  );

  if (idx >= 0) {
    Object.assign(care.appointments[idx], patch);
  } else {
    care.appointments.unshift({ ...patch, sortOrder: Date.now() });
  }

  await care.save();
};

const syncTreatmentHistoryFromAppointment = async (appointment, visitNotes) => {
  const care =
    (await PatientCareProfile.findOne({ patientCode: appointment.patientCode })) ??
    (await PatientCareProfile.create({
      patientCode: appointment.patientCode,
      patient: appointment.patient,
    }));

  const notes = visitNotes?.trim() || appointment.visitNotes?.trim() || appointment.followUpNotes?.trim() || '';
  const entry = {
    title: `${appointment.appointmentType} visit`,
    doctor: appointment.doctorName,
    status: 'Completed',
    dateRange: formatAppointmentDateDisplay(appointment.appointmentDate),
    description: notes || 'Visit completed',
    medicines: [],
    appointmentCode: appointment.appointmentCode,
    sortOrder: Date.now(),
  };

  const idx = care.treatmentHistory.findIndex(
    (t) => t.appointmentCode === appointment.appointmentCode
  );

  if (idx >= 0) {
    Object.assign(care.treatmentHistory[idx], entry);
  } else {
    care.treatmentHistory.unshift(entry);
  }

  await care.save();
};

const resolveConsultationFee = async (appointment, payloadFee) => {
  const raw = payloadFee?.toString?.().trim?.() ?? payloadFee;
  if (raw !== '' && raw != null && Number.isFinite(Number(raw))) {
    return Number(raw);
  }

  const doctor = await HmsStaff.findById(appointment.staff);
  if (!doctor) throw new Error(BILLING_MESSAGES.FEE_REQUIRED);

  const profileFee = Number(doctor.consultationFee);
  if (Number.isFinite(profileFee) && profileFee > 0) {
    return profileFee;
  }

  throw new Error(BILLING_MESSAGES.FEE_REQUIRED);
};

export const mapHmsToPatientCareAppointment = (a) => ({
  id: a.appointmentCode,
  appointmentCode: a.appointmentCode,
  date: a.dateDisplay,
  time: a.timeDisplay,
  type: a.appointmentType,
  doctor: a.doctorName,
  status: a.status,
  followUpDate: a.followUpDateDisplay || null,
  followUpDateIso: a.followUpDate || null,
  followUpTime: a.followUpTimeDisplay || null,
  followUpTimeSlot: a.followUpTimeSlot || null,
  hasFollowUp: Boolean(a.followUpDate),
  attendedAt: a.attendedAt,
});

export const listAppointments = async (staffCode) => {
  const query = staffCode ? { staffCode } : {};
  const rows = await HmsAppointment.find(query).sort({ appointmentDate: -1, timeSlot: 1 });
  return rows.map(formatHmsAppointment);
};

export const listAppointmentsByStaff = async (staffCode) => {
  const rows = await HmsAppointment.find({ staffCode, status: { $ne: 'Cancelled' } }).sort({
    appointmentDate: -1,
    timeSlot: 1,
  });
  return rows.map(formatHmsAppointment);
};

export const listAppointmentsByPatient = async (patientCode) => {
  const rows = await HmsAppointment.find({ patientCode }).sort({
    appointmentDate: -1,
    timeSlot: 1,
  });
  return rows.map(formatHmsAppointment);
};

export const getBookedSlotsForDoctor = async (staffCode, date) => {
  const appointmentDate = normalizeAppointmentDate(date);
  const rows = await HmsAppointment.find({
    staffCode,
    appointmentDate,
    status: { $ne: 'Cancelled' },
  }).select('timeSlot');
  return rows.map((r) => r.timeSlot);
};

export const getAvailabilityForDoctor = async (staffCode, date) => {
  const booked = await getBookedSlotsForDoctor(staffCode, date);
  return {
    staffCode,
    date: moment.utc(normalizeAppointmentDate(date)).format('YYYY-MM-DD'),
    bookedSlots: booked,
    availableSlots: APPOINTMENT_TIME_SLOTS.filter((slot) => !booked.includes(slot)),
  };
};

export const getAppointmentStats = async (staffCode) => {
  const today = moment.utc().startOf('day').toDate();
  const tomorrow = moment.utc().add(1, 'day').startOf('day').toDate();
  const scope = staffCode ? { staffCode } : {};

  const [scheduledToday, completed, panchakarma, cancelled] = await Promise.all([
    HmsAppointment.countDocuments({
      ...scope,
      appointmentDate: { $gte: today, $lt: tomorrow },
      status: { $in: ['Upcoming', 'Completed'] },
    }),
    HmsAppointment.countDocuments({
      ...scope,
      appointmentDate: { $gte: today, $lt: tomorrow },
      status: 'Completed',
    }),
    HmsAppointment.countDocuments({
      ...scope,
      appointmentType: 'Panchakarma',
      status: { $ne: 'Cancelled' },
    }),
    HmsAppointment.countDocuments({
      ...scope,
      appointmentDate: { $gte: today, $lt: tomorrow },
      status: 'Cancelled',
    }),
  ]);

  return { scheduledToday, completed, panchakarma, cancelled };
};

const resolveDoctor = async (staffCode) => {
  const doctor = await HmsStaff.findOne({ staffCode, status: true });
  if (!doctor) throw new Error(ErrorMessages.DOCTOR_NOT_FOUND);
  if (doctor.role !== 'Doctor') throw new Error(APPOINTMENT_MESSAGES.STAFF_NOT_DOCTOR);
  return doctor;
};

const resolvePatient = async (patientCode) => {
  const patient = await HmsPatient.findOne({ patientCode, status: true });
  if (!patient) throw new Error(ErrorMessages.PATIENT_NOT_FOUND);
  return patient;
};

export const createAppointment = async (payload, createdBy) => {
  assertValidTimeSlot(payload.timeSlot);

  const [patient, doctor] = await Promise.all([
    resolvePatient(payload.patientCode),
    resolveDoctor(payload.staffCode),
  ]);

  const conflict = await findDoctorSlotConflict({
    staffCode: payload.staffCode,
    date: payload.date,
    timeSlot: payload.timeSlot,
  });

  if (conflict) {
    throw new Error(APPOINTMENT_MESSAGES.DOCTOR_SLOT_UNAVAILABLE);
  }

  const appointment = await HmsAppointment.create({
    appointmentCode: await generateAppointmentCode(),
    patientCode: patient.patientCode,
    patient: patient._id,
    patientName: patient.name,
    staffCode: doctor.staffCode,
    staff: doctor._id,
    doctorName: doctor.name,
    appointmentDate: normalizeAppointmentDate(payload.date),
    timeSlot: payload.timeSlot,
    timeDisplay: formatTimeDisplay(payload.timeSlot),
    appointmentType: payload.appointmentType || 'General Consult',
    notes: payload.notes?.trim() || '',
    status: 'Upcoming',
    createdBy,
  });

  await syncAppointmentToPatientCare(appointment);

  const fee = Number(doctor.consultationFee) || 0;
  if (fee > 0) {
    const actor =
      createdBy?.type === 'patient'
        ? { type: 'admin', name: createdBy.name ? `Patient — ${createdBy.name}` : 'Patient' }
        : createdBy?.type === 'staff'
          ? { type: 'staff', name: createdBy.name || 'Staff', staffCode: createdBy.staffCode || '' }
          : {
              type: 'admin',
              name: createdBy?.name || 'Admin',
              adminId: createdBy?.adminId,
            };
    const invoice = await createBookingInvoiceForAppointment(appointment, fee, actor);
    appointment.consultationFeeExpected = fee;
    appointment.consultationInvoiceCode = invoice.invoiceCode;
    appointment.paymentStatus = 'unpaid';
    await appointment.save();
  } else {
    appointment.paymentStatus = 'not_required';
    appointment.consultationFeeExpected = 0;
    await appointment.save();
  }

  return formatHmsAppointment(appointment);
};

export const listDoctorsForBooking = async (staffCode) => {
  const query = { role: 'Doctor', status: true };
  if (staffCode) query.staffCode = staffCode;
  const doctors = await HmsStaff.find(query).sort({ name: 1 });
  return doctors.map((d) => ({
    staffCode: d.staffCode,
    id: d.staffCode,
    name: d.name,
    title: d.title,
    role: d.role,
    consultationFee: Number(d.consultationFee) || 0,
  }));
};

export const getAppointmentByCode = async (appointmentCode, staffCode) => {
  const query = { appointmentCode };
  if (staffCode) query.staffCode = staffCode;
  const row = await HmsAppointment.findOne(query);
  if (!row) throw new Error(APPOINTMENT_MESSAGES.NOT_FOUND);
  return formatHmsAppointment(row);
};

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

export const attendAppointmentWithFollowUp = async (appointmentCode, payload, req) => {
  if (req.accountType === 'staff' && req.staff?.role !== 'Doctor') {
    throw new Error(ErrorMessages.ACCESS_DENIED);
  }

  const staffCode =
    req.accountType === 'staff' && req.staff?.role === 'Doctor' ? req.staff.staffCode : null;

  const query = { appointmentCode };
  if (staffCode) query.staffCode = staffCode;

  const row = await HmsAppointment.findOne(query);
  if (!row) throw new Error(APPOINTMENT_MESSAGES.NOT_FOUND);
  if (row.status === 'Cancelled') throw new Error(APPOINTMENT_MESSAGES.ALREADY_CANCELLED);

  const actor = performerFromReq(req);
  const now = new Date();

  const wasCompleted = row.status === 'Completed';

  let resolvedFee = null;
  if (!wasCompleted) {
    if (row.consultationInvoiceCode) {
      const bookingInvoice = await HmsInvoice.findOne({
        invoiceCode: row.consultationInvoiceCode,
      });
      if (bookingInvoice?.status === 'Paid') {
        resolvedFee = bookingInvoice.amount;
      }
    }
    if (resolvedFee == null) {
      resolvedFee = await resolveConsultationFee(row, payload.consultationFee);
    }
  }

  if (row.status !== 'Completed') {
    row.status = 'Completed';
    row.attendedAt = now;
    row.attendedBy = actor;
    row.consultationFeeCharged = resolvedFee;
  }

  const visitNotes = payload.visitNotes?.trim?.() || '';
  if (visitNotes) {
    row.visitNotes = visitNotes;
  }

  const followUpDateRaw = payload.followUpDate?.trim?.() || payload.followUpDate;
  const followUpNotes = payload.followUpNotes?.trim?.() || '';
  const followUpTimeRaw = payload.followUpTimeSlot?.trim?.() || payload.followUpTimeSlot;

  if (followUpDateRaw) {
    const nextTimeSlot = followUpTimeRaw || row.timeSlot;
    assertValidTimeSlot(nextTimeSlot);

    const followUpChanged =
      !row.followUpDate ||
      formatAppointmentDateIso(row.followUpDate) !==
        formatAppointmentDateIso(normalizeAppointmentDate(followUpDateRaw)) ||
      row.followUpTimeSlot !== nextTimeSlot;

    row.followUpDate = normalizeAppointmentDate(followUpDateRaw);
    row.followUpTimeSlot = nextTimeSlot;
    row.followUpTimeDisplay = formatTimeDisplay(nextTimeSlot);
    row.followUpNotes = followUpNotes;
    row.followUpAddedBy = actor;
    row.followUpAddedAt = now;
    if (followUpChanged) row.followUpReminderSentAt = null;
  } else if (followUpNotes) {
    row.followUpNotes = followUpNotes;
    row.followUpAddedBy = actor;
    row.followUpAddedAt = now;
  }

  await row.save();
  await syncCareFromAppointment(row);
  await syncTreatmentHistoryFromAppointment(row, visitNotes);

  if (!wasCompleted) {
    await createConsultationInvoiceFromAppointment(row, req, resolvedFee, {
      markPaid: payload.markPaid === true,
      paymentMethod: payload.paymentMethod,
    });
  }

  return formatHmsAppointment(row);
};
