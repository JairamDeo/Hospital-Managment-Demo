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
    totalDays: p.totalDays,
    currentDay: p.currentDay,
    room: p.room,
    startDate: formatProgramStartDateIso(p.startDate),
    startDateDisplay: formatProgramStartDateDisplay(p.startDate),
    progress,
    status,
    createdBy: p.createdBy,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
};
