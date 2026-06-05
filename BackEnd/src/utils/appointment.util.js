import moment from 'moment';
import HmsAppointment from '../models/hmsAppointment.model.js';

export const APPOINTMENT_TIME_SLOTS = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '11:45',
  '12:00',
  '12:30',
  '13:00',
  '13:15',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
];

export const APPOINTMENT_TYPES = [
  'General Consult',
  'Panchakarma',
  'Follow-up',
  'Diet Consult',
  'Shodhana',
];

export const normalizeAppointmentDate = (dateInput) => {
  const parsed = moment(dateInput, ['YYYY-MM-DD', moment.ISO_8601], true);
  if (!parsed.isValid()) {
    throw new Error('Invalid appointment date');
  }
  return parsed.startOf('day').toDate();
};

export const formatAppointmentDateIso = (date) => moment(date).format('YYYY-MM-DD');

export const formatAppointmentDateDisplay = (date) => moment(date).format('MMM D, YYYY');

export const formatTimeDisplay = (time24) => {
  const parsed = moment(time24, 'HH:mm', true);
  if (!parsed.isValid()) return time24;
  return parsed.format('h:mm A');
};

export const assertValidTimeSlot = (timeSlot) => {
  if (!APPOINTMENT_TIME_SLOTS.includes(timeSlot)) {
    throw new Error('Invalid appointment time slot');
  }
};

export const findDoctorSlotConflict = async ({ staffCode, date, timeSlot, excludeId }) => {
  const appointmentDate = normalizeAppointmentDate(date);
  const query = {
    staffCode,
    appointmentDate,
    timeSlot,
    status: { $ne: 'Cancelled' },
  };
  if (excludeId) query._id = { $ne: excludeId };
  return HmsAppointment.findOne(query).lean();
};
