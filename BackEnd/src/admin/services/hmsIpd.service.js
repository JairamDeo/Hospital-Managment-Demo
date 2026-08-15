import HmsIpdAdmission from '../../models/hmsIpdAdmission.model.js';
import HmsPatient from '../../models/hmsPatient.model.js';
import HmsStaff from '../../models/hmsStaff.model.js';
import { ErrorMessages, IPD_MESSAGES } from '../../utils/constants.js';
import { formatHmsIpdAdmission } from '../../utils/formatHmsIpdAdmission.js';
import { generateIpdCode } from '../../utils/generateIpdCode.js';
import {
  assertRoomHasCapacity,
  countActiveIpdInRoom,
  listRoomsWithOccupancy,
} from '../../utils/roomCapacity.util.js';

const resolvePatient = async (patientCode) => {
  const patient = await HmsPatient.findOne({ patientCode, status: true });
  if (!patient) throw new Error(ErrorMessages.PATIENT_NOT_FOUND);
  return patient;
};

const resolveDoctor = async (staffCode) => {
  const doctor = await HmsStaff.findOne({ staffCode, status: true });
  if (!doctor) throw new Error(ErrorMessages.STAFF_NOT_FOUND);
  if (doctor.role !== 'Doctor') throw new Error(IPD_MESSAGES.STAFF_NOT_DOCTOR);
  return doctor;
};

const recordedByFromReq = (req) => {
  if (req.accountType === 'staff') {
    return {
      type: 'staff',
      staffCode: req.staff?.staffCode || '',
      name: req.staff?.name || '',
    };
  }
  return {
    type: 'admin',
    staffCode: '',
    name: req.admin?.name || 'Administrator',
  };
};

export const listIpdAdmissions = async (status) => {
  const query = {};
  if (status) query.status = status;
  const rows = await HmsIpdAdmission.find(query).sort({ admittedAt: -1, createdAt: -1 });
  return rows.map(formatHmsIpdAdmission);
};

export const getIpdStats = async () => {
  const [admittedCount, rooms] = await Promise.all([
    HmsIpdAdmission.countDocuments({ status: 'Admitted' }),
    listRoomsWithOccupancy({ roomType: 'IPD', activeOnly: true }),
  ]);

  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const totalOccupied = rooms.reduce((sum, r) => sum + r.occupied, 0);
  const availableBeds = Math.max(0, totalCapacity - totalOccupied);

  return {
    admittedCount,
    totalCapacity,
    totalOccupied,
    availableBeds,
    rooms,
  };
};

export const listIpdRoomsStatus = async () => {
  const rooms = await listRoomsWithOccupancy({ roomType: 'IPD', activeOnly: true });
  return rooms.map((r) => ({
    id: r.code,
    roomCode: r.code,
    roomNumber: r.roomNumber,
    name: r.name,
    capacity: r.capacity,
    occupied: r.occupied,
    available: r.available,
    status: r.isFull ? 'Full' : r.occupied > 0 ? 'Partial' : 'Available',
  }));
};

export const getIpdAdmissionByCode = async (admissionCode) => {
  const row = await HmsIpdAdmission.findOne({ admissionCode });
  if (!row) throw new Error(IPD_MESSAGES.NOT_FOUND);
  return formatHmsIpdAdmission(row);
};

export const createIpdAdmission = async (payload, req) => {
  const [patient, doctor, room] = await Promise.all([
    resolvePatient(payload.patientCode),
    resolveDoctor(payload.staffCode),
    assertRoomHasCapacity(payload.roomCode, 'IPD'),
  ]);

  const existing = await HmsIpdAdmission.findOne({
    patientCode: patient.patientCode,
    status: 'Admitted',
  });
  if (existing) throw new Error(IPD_MESSAGES.PATIENT_ALREADY_ADMITTED);

  const admission = await HmsIpdAdmission.create({
    admissionCode: await generateIpdCode(),
    patientCode: patient.patientCode,
    patient: patient._id,
    patientName: patient.name,
    roomCode: room.code,
    room: room._id,
    roomName: room.name,
    roomNumber: room.roomNumber,
    staffCode: doctor.staffCode,
    staff: doctor._id,
    doctorName: doctor.name,
    admittedAt: new Date(payload.admittedAt),
    expectedDischargeAt: payload.expectedDischargeAt
      ? new Date(payload.expectedDischargeAt)
      : null,
    diagnosis: payload.diagnosis?.trim() || '',
    chiefComplaint: payload.chiefComplaint?.trim() || '',
    status: 'Admitted',
  });

  return formatHmsIpdAdmission(admission);
};

const resolveBp = (payload = {}) => {
  const direct = payload.bp?.trim();
  if (direct) return direct;
  const systolic = payload.bpSystolic?.trim() || '';
  const diastolic = payload.bpDiastolic?.trim() || '';
  if (systolic && diastolic) return `${systolic}/${diastolic}`;
  return systolic || diastolic || '';
};

export const addIpdCaseNote = async (admissionCode, payload, req) => {
  const admission = await HmsIpdAdmission.findOne({ admissionCode });
  if (!admission) throw new Error(IPD_MESSAGES.NOT_FOUND);
  if (admission.status !== 'Admitted') throw new Error(IPD_MESSAGES.ALREADY_DISCHARGED);

  admission.caseNotes.push({
    noteDate: payload.noteDate ? new Date(payload.noteDate) : new Date(),
    treatmentGiven: payload.treatmentGiven?.trim() || '',
    medicines: payload.medicines?.trim() || '',
    observations: payload.observations?.trim() || '',
    bp: resolveBp(payload),
    pulse: payload.pulse?.trim() || '',
    spo2: payload.spo2?.trim() || '',
    recordedBy: recordedByFromReq(req),
  });

  await admission.save();
  return formatHmsIpdAdmission(admission);
};

export const dischargeIpdPatient = async (admissionCode, payload, req) => {
  const admission = await HmsIpdAdmission.findOne({ admissionCode });
  if (!admission) throw new Error(IPD_MESSAGES.NOT_FOUND);
  if (admission.status === 'Discharged') throw new Error(IPD_MESSAGES.ALREADY_DISCHARGED);

  const now = new Date();
  admission.status = 'Discharged';
  admission.dischargedAt = now;
  admission.dischargeSummary = {
    diagnosis: payload.diagnosis?.trim() || admission.diagnosis || '',
    treatmentSummary: payload.treatmentSummary?.trim() || '',
    medicinesAtDischarge: payload.medicinesAtDischarge?.trim() || '',
    advice: payload.advice?.trim() || '',
    followUpDate: payload.followUpDate ? new Date(payload.followUpDate) : null,
    dischargedBy: recordedByFromReq(req),
  };

  if (payload.diagnosis?.trim()) {
    admission.diagnosis = payload.diagnosis.trim();
  }

  await admission.save();
  return formatHmsIpdAdmission(admission);
};

export const listAdmissionsByPatient = async (patientCode) => {
  const rows = await HmsIpdAdmission.find({ patientCode }).sort({ admittedAt: -1 });
  return rows.map(formatHmsIpdAdmission);
};

export const getIpdRoomAvailability = async (roomCode) => {
  const occupied = await countActiveIpdInRoom(roomCode);
  return { roomCode, occupied };
};
