import {
  computeProgramProgress,
  deriveProgramStatus,
  formatProgramStartDateDisplay,
  formatProgramStartDateIso,
} from './panchakarma.util.js';
import { getInitialsFromName, pickAvatarClass } from './staffDisplay.util.js';

export const formatHmsPanchakarmaProgram = (doc) => {
  const p = doc.toObject ? doc.toObject() : { ...doc };
  const status = deriveProgramStatus(p.currentDay, p.totalDays, p.status);
  const progress = computeProgramProgress(p.currentDay, p.totalDays);
  const dailySessions = (p.dailySessions ?? []).map((s, index) => ({
      id: String(s._id ?? `ds-${index}`),
      dayNumber: s.dayNumber,
      sessionDate: s.sessionDate,
      time: s.time || '',
      duration: s.duration || '',
      panchakarmaType: s.panchakarmaType || '',
      medicineContent: s.medicineContent || '',
  }));

  return {
    _id: String(p._id),
    programCode: p.programCode,
    id: p.programCode,
    patientCode: p.patientCode,
    patientId: p.patientCode,
    patientName: p.patientName,
    initials: getInitialsFromName(p.patientName),
    avatarClass: pickAvatarClass(p.patientName),
    staffCode: p.staffCode,
    therapistId: p.staffCode,
    therapistName: p.therapistName,
    therapy: p.therapy,
    treatmentName: p.treatmentName || '',
    totalFees: Number(p.totalFees) || 0,
    amountPaid: Number(p.amountPaid) || 0,
    appointmentCode: p.appointmentCode || '',
    dailySessions,
    totalDays: p.totalDays,
    currentDay: p.currentDay,
    roomCode: p.roomCode || '',
    room: p.room,
    startDate: formatProgramStartDateIso(p.startDate),
    startDateDisplay: formatProgramStartDateDisplay(p.startDate),
    progress,
    status,
    needsAttend:
      dailySessions.length === 0 &&
      status !== 'Complete' &&
      status !== 'Cancelled' &&
      (status === 'Starting' || status === 'Ongoing'),
    createdBy: p.createdBy,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
};
