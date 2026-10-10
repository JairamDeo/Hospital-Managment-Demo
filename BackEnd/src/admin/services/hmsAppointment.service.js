import moment from 'moment';
import HmsAppointment from '../../models/hmsAppointment.model.js';
import HmsInvoice from '../../models/hmsInvoice.model.js';
import HmsPatient from '../../models/hmsPatient.model.js';
import HmsStaff from '../../models/hmsStaff.model.js';
import PatientCareProfile from '../../models/patientCareProfile.model.js';
import AppointmentSlotMaster from '../../models/appointmentSlotMaster.model.js';
import { ErrorMessages, APPOINTMENT_MESSAGES, BILLING_MESSAGES } from '../../utils/constants.js';
import {
  assertValidTimeSlot,
  findDoctorSlotConflict,
  formatAppointmentDateDisplay,
  formatAppointmentDateIso,
  formatTimeDisplay,
  isAppointmentSlotPast,
  minutesUntilAppointment,
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
  const appointmentDate = normalizeAppointmentDate(date);
  const [rows, masters] = await Promise.all([
    HmsAppointment.find({
      staffCode,
      appointmentDate,
      status: { $ne: 'Cancelled' },
    })
      .select('timeSlot')
      .lean(),
    AppointmentSlotMaster.find({ active: true }).select('time maxAppointments').lean(),
  ]);

  const bookedCounts = {};
  for (const row of rows) {
    const key = row.timeSlot;
    bookedCounts[key] = (bookedCounts[key] || 0) + 1;
  }

  const maxByTime = {};
  for (const m of masters) {
    maxByTime[m.time] = Math.max(1, Number(m.maxAppointments) || 1);
  }

  const masterTimes = masters.map((m) => m.time);
  const fullSlots = masterTimes.filter(
    (time) => (bookedCounts[time] || 0) >= (maxByTime[time] || 1)
  );

  // Legacy: any time not in master that already has a booking is treated as full
  for (const time of Object.keys(bookedCounts)) {
    if (!maxByTime[time] && bookedCounts[time] > 0 && !fullSlots.includes(time)) {
      fullSlots.push(time);
    }
  }

  const now = moment();
  const dateIso = moment.utc(appointmentDate).format('YYYY-MM-DD');
  const isToday = dateIso === now.format('YYYY-MM-DD');

  const availableSlots = masterTimes.filter((time) => {
    if (fullSlots.includes(time)) return false;
    if (isToday && isAppointmentSlotPast(appointmentDate, time, now)) return false;
    return true;
  });

  const pastSlots = isToday
    ? masterTimes.filter((time) => isAppointmentSlotPast(appointmentDate, time, now))
    : [];

  const slotStats = masterTimes.map((time) => ({
    time,
    booked: bookedCounts[time] || 0,
    maxAppointments: maxByTime[time] || 1,
    remaining: Math.max(0, (maxByTime[time] || 1) - (bookedCounts[time] || 0)),
    past: pastSlots.includes(time),
  }));

  return {
    staffCode,
    date: dateIso,
    /** Slots that cannot accept more bookings (at capacity) */
    bookedSlots: fullSlots,
    /** Past slots for today — UI should hide these */
    pastSlots,
    availableSlots,
    slotStats,
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

  const appointmentDate = normalizeAppointmentDate(payload.date);
  const todayStart = moment.utc().startOf('day');
  if (moment.utc(appointmentDate).isBefore(todayStart)) {
    throw new Error('Cannot book an appointment for a past date');
  }
  if (isAppointmentSlotPast(appointmentDate, payload.timeSlot)) {
    throw new Error('Cannot book a time slot that has already passed');
  }

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
    throw new Error(
      conflict.maxAppointments > 1
        ? `This time slot is full (${conflict.count}/${conflict.maxAppointments} appointments)`
        : APPOINTMENT_MESSAGES.DOCTOR_SLOT_UNAVAILABLE
    );
  }

  const patientConflict = await HmsAppointment.findOne({
    patientCode: payload.patientCode,
    appointmentDate: normalizeAppointmentDate(payload.date),
    timeSlot: payload.timeSlot,
    status: { $ne: 'Cancelled' },
  });

  if (patientConflict) {
    throw new Error('You already have an appointment scheduled at this time.');
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
    appointmentType:
      payload.appointmentType && payload.appointmentType !== 'General Consult'
        ? payload.appointmentType
        : 'Diet Consult',
    consultationMode: payload.consultationMode === 'Online' ? 'Online' : 'Offline',
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

export const cancelAppointment = async (appointmentCode, reason = '') => {
  const row = await HmsAppointment.findOne({ appointmentCode });
  if (!row) throw new Error(APPOINTMENT_MESSAGES.NOT_FOUND);
  if (row.status === 'Cancelled') throw new Error(APPOINTMENT_MESSAGES.ALREADY_CANCELLED);
  if (row.status === 'Completed') throw new Error('Completed appointments cannot be cancelled');

  row.status = 'Cancelled';
  if (reason?.trim()) {
    row.notes = row.notes
      ? `${row.notes}\n[Cancelled] ${reason.trim()}`
      : `[Cancelled] ${reason.trim()}`;
  }
  await row.save();
  await syncCareFromAppointment(row);
  return formatHmsAppointment(row);
};

export const rescheduleAppointment = async (appointmentCode, payload) => {
  assertValidTimeSlot(payload.timeSlot);
  const row = await HmsAppointment.findOne({ appointmentCode });
  if (!row) throw new Error(APPOINTMENT_MESSAGES.NOT_FOUND);
  if (row.status === 'Cancelled') throw new Error(APPOINTMENT_MESSAGES.ALREADY_CANCELLED);
  if (row.status === 'Completed') throw new Error('Completed appointments cannot be rescheduled');

  const appointmentDate = normalizeAppointmentDate(payload.date);
  const todayStart = moment.utc().startOf('day');
  if (moment.utc(appointmentDate).isBefore(todayStart)) {
    throw new Error('Cannot reschedule to a past date');
  }
  if (isAppointmentSlotPast(appointmentDate, payload.timeSlot)) {
    throw new Error('Cannot reschedule to a time slot that has already passed');
  }

  const conflict = await findDoctorSlotConflict({
    staffCode: row.staffCode,
    date: payload.date,
    timeSlot: payload.timeSlot,
    excludeId: row._id,
  });
  if (conflict) {
    throw new Error(
      conflict.maxAppointments > 1
        ? `This time slot is full (${conflict.count}/${conflict.maxAppointments} appointments)`
        : APPOINTMENT_MESSAGES.DOCTOR_SLOT_UNAVAILABLE
    );
  }

  row.appointmentDate = appointmentDate;
  row.timeSlot = payload.timeSlot;
  row.timeDisplay = formatTimeDisplay(payload.timeSlot);
  if (payload.consultationMode === 'Online' || payload.consultationMode === 'Offline') {
    row.consultationMode = payload.consultationMode;
  }
  if (payload.notes !== undefined) row.notes = String(payload.notes || '').trim();
  await row.save();
  await syncCareFromAppointment(row);
  return formatHmsAppointment(row);
};

/**
 * Auto-cancel Upcoming appointments whose date+time has passed without attendance (acknowledgement).
 */
export const autoCancelUnacknowledgedPastAppointments = async () => {
  const now = moment();
  const candidates = await HmsAppointment.find({
    status: 'Upcoming',
    attendedAt: null,
    appointmentDate: { $lte: now.clone().endOf('day').toDate() },
  });

  let cancelled = 0;
  for (const row of candidates) {
    const minutesUntil = minutesUntilAppointment(row.appointmentDate, row.timeSlot, now);
    if (minutesUntil > 0) continue;
    row.status = 'Cancelled';
    row.notes = row.notes
      ? `${row.notes}\n[Auto-cancelled] No acknowledgement / attendance after scheduled time`
      : '[Auto-cancelled] No acknowledgement / attendance after scheduled time';
    await row.save();
    try {
      await syncCareFromAppointment(row);
    } catch (err) {
      // Care profile sync must not block cancellation
      console.error('Care sync after auto-cancel failed:', err?.message || err);
    }
    cancelled += 1;
  }
  return cancelled;
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
  const staffRole = req.staff?.role;
  if (req.accountType === 'staff' && staffRole !== 'Doctor' && staffRole !== 'Support') {
    throw new Error(ErrorMessages.ACCESS_DENIED);
  }

  // Doctors only see/attend their own visits; Admin/Support can attend any
  const staffCode =
    req.accountType === 'staff' && staffRole === 'Doctor' ? req.staff.staffCode : null;

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

/**
 * Save clinical fields before completing the visit (Attend overview step).
 * Does not mark the appointment Completed.
 */
export const saveVisitClinical = async (appointmentCode, payload, req) => {
  const staffRole = req.staff?.role;
  if (req.accountType === 'staff' && staffRole !== 'Doctor' && staffRole !== 'Support') {
    throw new Error(ErrorMessages.ACCESS_DENIED);
  }

  const doctorScope =
    req.accountType === 'staff' && staffRole === 'Doctor' ? req.staff.staffCode : null;

  const query = { appointmentCode };
  if (doctorScope) query.staffCode = doctorScope;

  const row = await HmsAppointment.findOne(query);
  if (!row) throw new Error(APPOINTMENT_MESSAGES.NOT_FOUND);
  if (row.status === 'Cancelled') throw new Error(APPOINTMENT_MESSAGES.ALREADY_CANCELLED);

  const chiefComplaint = String(payload.chiefComplaint ?? '').trim();
  if (!chiefComplaint) {
    throw new Error('Chief complaint is required');
  }

  row.chiefComplaint = chiefComplaint;
  row.symptoms = String(payload.symptoms ?? '').trim();
  row.diagnosis = String(payload.diagnosis ?? '').trim();

  if (payload.visitVitals && typeof payload.visitVitals === 'object') {
    row.visitVitals = {
      temp: String(payload.visitVitals.temp ?? '').trim(),
      bp: String(payload.visitVitals.bp ?? '').trim(),
      pulse: String(payload.visitVitals.pulse ?? '').trim(),
      spo2: String(payload.visitVitals.spo2 ?? '').trim(),
      weight: String(payload.visitVitals.weight ?? '').trim(),
    };
    row.markModified('visitVitals');
  }

  const nextStaffCode = payload.staffCode?.trim?.();
  if (nextStaffCode && nextStaffCode !== row.staffCode) {
    if (req.accountType === 'staff' && staffRole === 'Doctor') {
      throw new Error(ErrorMessages.ACCESS_DENIED);
    }
    const doctor = await resolveDoctor(nextStaffCode);
    const conflict = await findDoctorSlotConflict({
      staffCode: doctor.staffCode,
      date: formatAppointmentDateIso(row.appointmentDate),
      timeSlot: row.timeSlot,
      excludeId: row._id,
    });
    if (conflict) {
      throw new Error(
        conflict.maxAppointments > 1
          ? `This time slot is full for the selected doctor (${conflict.count}/${conflict.maxAppointments})`
          : APPOINTMENT_MESSAGES.DOCTOR_SLOT_UNAVAILABLE
      );
    }
    row.staffCode = doctor.staffCode;
    row.staff = doctor._id;
    row.doctorName = doctor.name;
  }

  await row.save();
  return formatHmsAppointment(row);
};
