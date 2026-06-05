import {
  formatAppointmentDateDisplay,
  formatAppointmentDateIso,
} from './appointment.util.js';
import { getInitialsFromName, pickAvatarClass } from './staffDisplay.util.js';

const adminStatusMap = {
  Upcoming: 'Soon',
  Completed: 'Done',
  Cancelled: 'Cancelled',
};

export const formatHmsAppointment = (doc) => {
  const a = doc.toObject ? doc.toObject() : { ...doc };

  return {
    _id: String(a._id),
    appointmentCode: a.appointmentCode,
    id: a.appointmentCode,
    patientCode: a.patientCode,
    patientId: a.patientCode,
    patientName: a.patientName,
    initials: getInitialsFromName(a.patientName),
    avatarClass: pickAvatarClass(a.patientName),
    staffCode: a.staffCode,
    doctorId: a.staffCode,
    doctorName: a.doctorName,
    doctor: a.doctorName,
    type: a.appointmentType,
    appointmentType: a.appointmentType,
    date: formatAppointmentDateIso(a.appointmentDate),
    dateDisplay: formatAppointmentDateDisplay(a.appointmentDate),
    time: a.timeSlot,
    timeDisplay: a.timeDisplay,
    status: a.status,
    adminStatus: adminStatusMap[a.status] ?? 'Soon',
    notes: a.notes || '',
    createdBy: a.createdBy,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
};
