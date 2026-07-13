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
    timeSlot: a.timeSlot,
    timeDisplay: a.timeDisplay,
    status: a.status,
    adminStatus: adminStatusMap[a.status] ?? 'Soon',
    notes: a.notes || '',
    attendedAt: a.attendedAt,
    attendedBy: a.attendedBy,
    followUpDate: a.followUpDate ? formatAppointmentDateIso(a.followUpDate) : null,
    followUpDateDisplay: a.followUpDate ? formatAppointmentDateDisplay(a.followUpDate) : null,
    followUpTimeSlot: a.followUpTimeSlot || null,
    followUpTimeDisplay: a.followUpTimeDisplay || null,
    followUpNotes: a.followUpNotes || '',
    visitNotes: a.visitNotes || '',
    consultationFeeCharged: a.consultationFeeCharged ?? null,
    consultationFeeExpected: a.consultationFeeExpected ?? null,
    consultationInvoiceCode: a.consultationInvoiceCode || '',
    paymentStatus: a.paymentStatus || 'not_required',
    followUpAddedBy: a.followUpAddedBy,
    followUpAddedAt: a.followUpAddedAt,
    createdBy: a.createdBy,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
};
