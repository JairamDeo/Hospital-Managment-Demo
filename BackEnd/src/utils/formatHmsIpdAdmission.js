import { getInitialsFromName, pickAvatarClass } from './staffDisplay.util.js';

const formatCaseNote = (note) => ({
  id: String(note._id),
  noteDate: note.noteDate,
  treatmentGiven: note.treatmentGiven || '',
  medicines: note.medicines || '',
  observations: note.observations || '',
  bp: note.bp || '',
  pulse: note.pulse || '',
  spo2: note.spo2 || '',
  recordedBy: note.recordedBy || null,
});

export const formatHmsIpdAdmission = (doc) => {
  const a = doc.toObject ? doc.toObject() : { ...doc };

  return {
    _id: String(a._id),
    admissionCode: a.admissionCode,
    id: a.admissionCode,
    patientCode: a.patientCode,
    patientId: a.patientCode,
    patientName: a.patientName,
    initials: getInitialsFromName(a.patientName),
    avatarClass: pickAvatarClass(a.patientName),
    roomCode: a.roomCode,
    roomName: a.roomName,
    roomNumber: a.roomNumber,
    staffCode: a.staffCode,
    doctorName: a.doctorName,
    admittedAt: a.admittedAt,
    expectedDischargeAt: a.expectedDischargeAt,
    status: a.status,
    dischargedAt: a.dischargedAt,
    diagnosis: a.diagnosis || '',
    chiefComplaint: a.chiefComplaint || '',
    caseNotes: (a.caseNotes ?? []).map(formatCaseNote),
    dischargeSummary: a.dischargeSummary || null,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
};
