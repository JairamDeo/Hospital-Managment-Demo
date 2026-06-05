import moment from 'moment';
import HmsAppointment from '../../models/hmsAppointment.model.js';
import HmsPatient from '../../models/hmsPatient.model.js';
import HmsStaff from '../../models/hmsStaff.model.js';
import PatientCareProfile from '../../models/patientCareProfile.model.js';
import { ErrorMessages, APPOINTMENT_MESSAGES } from '../../utils/constants.js';
import {
  APPOINTMENT_TIME_SLOTS,
  assertValidTimeSlot,
  findDoctorSlotConflict,
  formatAppointmentDateDisplay,
  formatTimeDisplay,
  normalizeAppointmentDate,
} from '../../utils/appointment.util.js';
import { formatHmsAppointment } from '../../utils/formatHmsAppointment.js';
import { generateAppointmentCode } from '../../utils/generateAppointmentCode.js';

const syncAppointmentToPatientCare = async (appointment) => {
  const care =
    (await PatientCareProfile.findOne({ patientCode: appointment.patientCode })) ??
    (await PatientCareProfile.create({
      patientCode: appointment.patientCode,
      patient: appointment.patient,
    }));

  const entry = {
    date: formatAppointmentDateDisplay(appointment.appointmentDate),
    time: appointment.timeDisplay,
    type: appointment.appointmentType,
    doctor: appointment.doctorName,
    status: appointment.status === 'Cancelled' ? 'Cancelled' : 'Upcoming',
    sortOrder: Date.now(),
  };

  care.appointments.unshift(entry);
  await care.save();
};

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
    date: moment(normalizeAppointmentDate(date)).format('YYYY-MM-DD'),
    bookedSlots: booked,
    availableSlots: APPOINTMENT_TIME_SLOTS.filter((slot) => !booked.includes(slot)),
  };
};

export const getAppointmentStats = async () => {
  const today = moment().startOf('day').toDate();
  const tomorrow = moment().add(1, 'day').startOf('day').toDate();

  const [scheduledToday, completed, panchakarma, cancelled] = await Promise.all([
    HmsAppointment.countDocuments({
      appointmentDate: { $gte: today, $lt: tomorrow },
      status: 'Upcoming',
    }),
    HmsAppointment.countDocuments({ status: 'Completed' }),
    HmsAppointment.countDocuments({
      appointmentType: 'Panchakarma',
      status: { $ne: 'Cancelled' },
    }),
    HmsAppointment.countDocuments({ status: 'Cancelled' }),
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
    appointmentType: payload.appointmentType,
    notes: payload.notes?.trim() || '',
    status: 'Upcoming',
    createdBy,
  });

  await syncAppointmentToPatientCare(appointment);
  return formatHmsAppointment(appointment);
};

export const listDoctorsForBooking = async () => {
  const doctors = await HmsStaff.find({ role: 'Doctor', status: true }).sort({ name: 1 });
  return doctors.map((d) => ({
    staffCode: d.staffCode,
    id: d.staffCode,
    name: d.name,
    title: d.title,
    role: d.role,
  }));
};
