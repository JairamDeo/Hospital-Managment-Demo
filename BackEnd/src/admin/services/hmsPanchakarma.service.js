import HmsPanchakarmaProgram from '../../models/hmsPanchakarmaProgram.model.js';
import HmsPatient from '../../models/hmsPatient.model.js';
import HmsStaff from '../../models/hmsStaff.model.js';
import PatientCareProfile from '../../models/patientCareProfile.model.js';
import { ErrorMessages, PANCHAKARMA_MESSAGES } from '../../utils/constants.js';
import { formatHmsPanchakarmaProgram } from '../../utils/formatHmsPanchakarmaProgram.js';
import { generatePanchakarmaCode } from '../../utils/generatePanchakarmaCode.js';
import {
  computeProgramProgress,
  normalizeProgramStartDate,
  PANCHAKARMA_THERAPIES,
} from '../../utils/panchakarma.util.js';

const syncProgramToPatientCare = async (program) => {
  const care =
    (await PatientCareProfile.findOne({ patientCode: program.patientCode })) ??
    (await PatientCareProfile.create({
      patientCode: program.patientCode,
      patient: program.patient,
    }));

  care.activeTreatment = {
    program: `Panchakarma — ${program.therapy}`,
    stage: program.room,
    dayCurrent: program.currentDay,
    dayTotal: program.totalDays,
    percentComplete: computeProgramProgress(program.currentDay, program.totalDays),
  };

  await care.save();
};

const resolveTherapist = async (staffCode) => {
  const therapist = await HmsStaff.findOne({ staffCode, status: true });
  if (!therapist) throw new Error(ErrorMessages.THERAPIST_NOT_FOUND);
  if (therapist.role !== 'Therapist') throw new Error(PANCHAKARMA_MESSAGES.STAFF_NOT_THERAPIST);
  return therapist;
};

const resolvePatient = async (patientCode) => {
  const patient = await HmsPatient.findOne({ patientCode, status: true });
  if (!patient) throw new Error(ErrorMessages.PATIENT_NOT_FOUND);
  return patient;
};

const findActiveRoomConflict = async (room, excludeId) => {
  const query = {
    room,
    status: { $in: ['Starting', 'Ongoing'] },
  };
  if (excludeId) query._id = { $ne: excludeId };
  return HmsPanchakarmaProgram.findOne(query).lean();
};

export const listPrograms = async () => {
  const rows = await HmsPanchakarmaProgram.find({ status: { $ne: 'Cancelled' } }).sort({
    startDate: -1,
    createdAt: -1,
  });
  return rows.map(formatHmsPanchakarmaProgram);
};

export const listProgramsByStaff = async (staffCode) => {
  const rows = await HmsPanchakarmaProgram.find({
    staffCode,
    status: { $ne: 'Cancelled' },
  }).sort({ startDate: -1 });
  return rows.map(formatHmsPanchakarmaProgram);
};

export const getPanchakarmaStats = async () => {
  const activeStatuses = ['Starting', 'Ongoing'];
  const [activePrograms, therapistsOnDuty, roomsAvailable] = await Promise.all([
    HmsPanchakarmaProgram.countDocuments({ status: { $in: activeStatuses } }),
    HmsStaff.countDocuments({ role: 'Therapist', status: true, dutyStatus: 'On Duty' }),
    HmsPanchakarmaProgram.countDocuments({ status: { $in: activeStatuses } }).then(
      async (occupied) => 4 - occupied
    ),
  ]);

  const therapySummaries = await Promise.all(
    PANCHAKARMA_THERAPIES.map(async (therapy) => ({
      therapy,
      activeSessions: await HmsPanchakarmaProgram.countDocuments({
        therapy,
        status: { $in: activeStatuses },
      }),
    }))
  );

  return {
    activePrograms,
    therapistsOnDuty,
    roomsAvailable: Math.max(0, roomsAvailable),
    therapySummaries,
  };
};

export const listTherapistsForPanchakarma = async () => {
  const therapists = await HmsStaff.find({ role: 'Therapist', status: true }).sort({ name: 1 });
  const activeStatuses = ['Starting', 'Ongoing'];

  const withCounts = await Promise.all(
    therapists.map(async (t) => {
      const patientCount = await HmsPanchakarmaProgram.countDocuments({
        staffCode: t.staffCode,
        status: { $in: activeStatuses },
      });
      return {
        staffCode: t.staffCode,
        id: t.staffCode,
        name: t.name,
        specialty: t.title,
        patientCount,
        dutyStatus: t.dutyStatus,
      };
    })
  );

  return withCounts;
};

export const listRoomsStatus = async () => {
  const active = await HmsPanchakarmaProgram.find({
    status: { $in: ['Starting', 'Ongoing'] },
  }).select('room therapy');

  const occupiedRooms = new Map(active.map((p) => [p.room, p.therapy]));

  return ['Room 1', 'Room 2', 'Room 3', 'Room 4'].map((name, index) => {
    const therapy = occupiedRooms.get(name);
    return {
      id: `R${index + 1}`,
      name,
      therapy: therapy ?? 'Vamana',
      status: therapy ? 'Occupied' : 'Available',
    };
  });
};

export const createProgram = async (payload, createdBy) => {
  const [patient, therapist] = await Promise.all([
    resolvePatient(payload.patientCode),
    resolveTherapist(payload.staffCode),
  ]);

  const roomConflict = await findActiveRoomConflict(payload.room);
  if (roomConflict) {
    throw new Error(PANCHAKARMA_MESSAGES.ROOM_UNAVAILABLE);
  }

  const program = await HmsPanchakarmaProgram.create({
    programCode: await generatePanchakarmaCode(),
    patientCode: patient.patientCode,
    patient: patient._id,
    patientName: patient.name,
    staffCode: therapist.staffCode,
    staff: therapist._id,
    therapistName: therapist.name,
    therapy: payload.therapy,
    totalDays: payload.totalDays,
    currentDay: 1,
    room: payload.room,
    startDate: normalizeProgramStartDate(payload.startDate),
    status: 'Starting',
    createdBy,
  });

  await syncProgramToPatientCare(program);
  return formatHmsPanchakarmaProgram(program);
};
