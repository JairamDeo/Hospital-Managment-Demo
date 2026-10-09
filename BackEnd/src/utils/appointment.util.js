import moment from 'moment';
import HmsAppointment from '../models/hmsAppointment.model.js';
import AppointmentSlotMaster from '../models/appointmentSlotMaster.model.js';

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
  'Panchakarma',
  'Follow-up',
  'Diet Consult',
  'Shodhana',
];

export const CONSULTATION_MODES = ['Offline', 'Online'];

export const normalizeAppointmentDate = (dateInput) => {
  const parsed = moment.utc(dateInput, ['YYYY-MM-DD', moment.ISO_8601], true);
  if (!parsed.isValid()) {
    throw new Error('Invalid appointment date');
  }
  return parsed.startOf('day').toDate();
};

export const formatAppointmentDateIso = (date) => moment.utc(date).format('YYYY-MM-DD');

export const formatAppointmentDateDisplay = (date) => moment(date).format('MMM D, YYYY');

export const formatTimeDisplay = (time24) => {
  const parsed = moment(time24, 'HH:mm', true);
  if (!parsed.isValid()) return time24;
  return parsed.format('h:mm A');
};

/** Combine UTC-stored appointment date with slot time (supports HH:mm and hh:mm A). */
export const combineAppointmentDateTime = (date, timeSlot) => {
  const dateStr = moment.utc(date).format('YYYY-MM-DD');
  const parsed = moment(
    `${dateStr} ${timeSlot}`,
    ['YYYY-MM-DD HH:mm', 'YYYY-MM-DD hh:mm A', 'YYYY-MM-DD h:mm A'],
    true
  );
  if (parsed.isValid()) return parsed;
  return moment(`${dateStr} ${timeSlot}`, 'YYYY-MM-DD HH:mm');
};

export const minutesUntilAppointment = (date, timeSlot, from = moment()) => {
  const apptAt = combineAppointmentDateTime(date, timeSlot);
  return apptAt.diff(from, 'minutes', true);
};

export const assertValidTimeSlot = (timeSlot) => {
  if (!/^(1[0-2]|0?[1-9]):[0-5][0-9] (AM|PM)$/i.test(timeSlot)) {
    throw new Error('Invalid appointment time slot format. Use HH:MM AM/PM');
  }
};

export const getSlotMaxAppointments = async (timeSlot) => {
  const slot = await AppointmentSlotMaster.findOne({
    time: new RegExp(`^${String(timeSlot).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  })
    .select('maxAppointments')
    .lean();
  return Math.max(1, Number(slot?.maxAppointments) || 1);
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

  const [count, maxAppointments] = await Promise.all([
    HmsAppointment.countDocuments(query),
    getSlotMaxAppointments(timeSlot),
  ]);

  if (count >= maxAppointments) {
    return { full: true, count, maxAppointments };
  }
  return null;
};
