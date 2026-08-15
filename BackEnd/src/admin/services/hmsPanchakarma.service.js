import HmsPanchakarmaProgram from '../../models/hmsPanchakarmaProgram.model.js';
import HmsPatient from '../../models/hmsPatient.model.js';
import HmsStaff from '../../models/hmsStaff.model.js';
import HmsAppointment from '../../models/hmsAppointment.model.js';
import PatientCareProfile from '../../models/patientCareProfile.model.js';
import { ErrorMessages, PANCHAKARMA_MESSAGES, APPOINTMENT_MESSAGES } from '../../utils/constants.js';
import { formatHmsPanchakarmaProgram } from '../../utils/formatHmsPanchakarmaProgram.js';
import { generatePanchakarmaCode } from '../../utils/generatePanchakarmaCode.js';
import { formatAppointmentDateDisplay } from '../../utils/appointment.util.js';
import { createPanchakarmaInvoice } from './hmsBilling.service.js';
import {
  computeProgramProgress,
  normalizeProgramStartDate,
  PANCHAKARMA_THERAPIES,
} from '../../utils/panchakarma.util.js';
import {
  assertRoomHasCapacity,
  listRoomsWithOccupancy,
} from '../../utils/roomCapacity.util.js';

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

export const listPrograms = async (staffCode) => {
  const query = { status: { $ne: 'Cancelled' } };
  if (staffCode) query.staffCode = staffCode;
  const rows = await HmsPanchakarmaProgram.find(query).sort({
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

export const listProgramsByPatient = async (patientCode, staffCode) => {
  const query = { patientCode };
  if (staffCode) query.staffCode = staffCode;
  const rows = await HmsPanchakarmaProgram.find(query).sort({
    startDate: -1,
    createdAt: -1,
  });
  return rows.map(formatHmsPanchakarmaProgram);
};

export const getPanchakarmaStats = async (staffCode) => {
  const activeStatuses = ['Starting', 'Ongoing'];
  const scope = staffCode ? { staffCode } : {};

  const [activePrograms, therapistsOnDuty, roomsAvailable] = await Promise.all([
    HmsPanchakarmaProgram.countDocuments({ ...scope, status: { $in: activeStatuses } }),
    staffCode
      ? Promise.resolve(1)
      : HmsStaff.countDocuments({ role: 'Therapist', status: true, dutyStatus: 'On Duty' }),
    listRoomsWithOccupancy({ roomType: 'Panchakarma', activeOnly: true }).then((rooms) =>
      rooms.reduce((sum, r) => sum + r.available, 0)
    ),
  ]);

  const therapySummaries = await Promise.all(
    PANCHAKARMA_THERAPIES.map(async (therapy) => ({
      therapy,
      activeSessions: await HmsPanchakarmaProgram.countDocuments({
        ...scope,
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

export const listTherapistsForPanchakarma = async (staffCode) => {
  const query = { role: 'Therapist', status: true };
  if (staffCode) query.staffCode = staffCode;
  const therapists = await HmsStaff.find(query).sort({ name: 1 });
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
  const [rooms, activePrograms] = await Promise.all([
    listRoomsWithOccupancy({ roomType: 'Panchakarma', activeOnly: true }),
    HmsPanchakarmaProgram.find({
      status: { $in: ['Starting', 'Ongoing'] },
    }).select('roomCode therapy'),
  ]);

  const therapyByRoom = new Map(activePrograms.map((p) => [p.roomCode, p.therapy]));

  return rooms.map((r) => ({
    id: r.code,
    roomCode: r.code,
    name: r.name,
    roomNumber: r.roomNumber,
    capacity: r.capacity,
    occupied: r.occupied,
    available: r.available,
    therapy: therapyByRoom.get(r.code) ?? '—',
    status: r.isFull ? 'Full' : r.occupied > 0 ? 'Partial' : 'Available',
  }));
};

export const createProgram = async (payload, createdBy) => {
  const [patient, therapist] = await Promise.all([
    resolvePatient(payload.patientCode),
    resolveTherapist(payload.staffCode),
  ]);

  const room = await assertRoomHasCapacity(payload.roomCode, 'Panchakarma');

  const dailySessions = (payload.dailySessions ?? []).map((row, index) => ({
    dayNumber: Number(row.dayNumber) || index + 1,
    sessionDate: row.sessionDate ? new Date(row.sessionDate) : null,
    time: row.time?.trim() || '',
    duration: row.duration?.trim() || '',
    panchakarmaType: row.panchakarmaType?.trim() || payload.therapy,
    medicineContent: row.medicineContent?.trim() || '',
  }));

  const program = await HmsPanchakarmaProgram.create({
    programCode: await generatePanchakarmaCode(),
    patientCode: patient.patientCode,
    patient: patient._id,
    patientName: patient.name,
    staffCode: therapist.staffCode,
    staff: therapist._id,
    therapistName: therapist.name,
    therapy: payload.therapy,
    treatmentName: payload.treatmentName?.trim() || payload.therapy,
    totalFees: Number(payload.totalFees) || 0,
    totalDays: payload.totalDays,
    currentDay: 1,
    roomCode: room.code,
    room: room.name,
    startDate: normalizeProgramStartDate(payload.startDate),
    dailySessions,
    status: dailySessions.length > 0 ? 'Ongoing' : 'Starting',
    createdBy,
  });

  await syncProgramToPatientCare(program);
  if (dailySessions.length > 0) {
    await syncPanchakarmaTreatmentHistory(program);
  }
  return formatHmsPanchakarmaProgram(program);
};

export const attendPanchakarmaProgram = async (programCode, payload, req) => {
  if (req.accountType !== 'staff' || req.staff?.role !== 'Therapist') {
    throw new Error(ErrorMessages.ACCESS_DENIED);
  }

  const program = await HmsPanchakarmaProgram.findOne({ programCode });
  if (!program) throw new Error(PANCHAKARMA_MESSAGES.NOT_FOUND);
  if (program.staffCode !== req.staff.staffCode) {
    throw new Error(ErrorMessages.ACCESS_DENIED);
  }
  if (program.status === 'Cancelled' || program.status === 'Complete') {
    throw new Error('This program cannot be updated');
  }

  const dailySessions = (payload.dailySessions ?? []).map((row, index) => ({
    dayNumber: Number(row.dayNumber) || index + 1,
    sessionDate: row.sessionDate ? new Date(row.sessionDate) : null,
    time: row.time?.trim() || '',
    duration: row.duration?.trim() || '',
    panchakarmaType: row.panchakarmaType?.trim() || program.therapy,
    medicineContent: row.medicineContent?.trim() || '',
  }));

  if (!dailySessions.length) {
    throw new Error('Daily session schedule is required');
  }

  program.treatmentName =
    payload.treatmentName?.trim() || program.treatmentName?.trim() || program.therapy;
  if (payload.totalFees == null || Number.isNaN(Number(payload.totalFees))) {
    throw new Error('Total fees is required');
  }
  program.totalFees = Number(payload.totalFees);
  program.dailySessions = dailySessions;
  program.status = 'Ongoing';
  program.currentDay = program.currentDay || 1;
  await program.save();

  await syncProgramToPatientCare(program);
  await syncPanchakarmaTreatmentHistory(program);

  return formatHmsPanchakarmaProgram(program);
};

const syncPanchakarmaTreatmentHistory = async (program) => {
  const care =
    (await PatientCareProfile.findOne({ patientCode: program.patientCode })) ??
    (await PatientCareProfile.create({
      patientCode: program.patientCode,
      patient: program.patient,
    }));

  const title = program.treatmentName?.trim() || `Panchakarma — ${program.therapy}`;
  const entry = {
    title,
    doctor: program.therapistName,
    status: program.status === 'Complete' ? 'Completed' : 'Active',
    dateRange: `${program.totalDays} day plan`,
    description: `Treatment plan by ${program.therapistName}`,
    medicines: [],
    appointmentCode: program.appointmentCode || '',
    sortOrder: Date.now(),
  };

  const idx = care.treatmentHistory.findIndex(
    (t) => t.appointmentCode && t.appointmentCode === program.appointmentCode
  );
  if (idx >= 0) Object.assign(care.treatmentHistory[idx], entry);
  else care.treatmentHistory.unshift(entry);

  await care.save();
};

export const createTreatmentPlanFromAppointment = async (appointmentCode, payload, req) => {
  if (req.accountType === 'staff' && req.staff?.role !== 'Therapist') {
    throw new Error(ErrorMessages.ACCESS_DENIED);
  }

  const staffCode =
    req.accountType === 'staff' && req.staff?.role === 'Therapist' ? req.staff.staffCode : null;

  const apptQuery = { appointmentCode };
  if (staffCode) apptQuery.staffCode = staffCode;

  const appointment = await HmsAppointment.findOne(apptQuery);
  if (!appointment) throw new Error(APPOINTMENT_MESSAGES.NOT_FOUND);
  if (appointment.status === 'Cancelled') throw new Error(APPOINTMENT_MESSAGES.ALREADY_CANCELLED);

  const therapist = await HmsStaff.findById(appointment.staff);
  if (!therapist || therapist.role !== 'Therapist') {
    throw new Error(PANCHAKARMA_MESSAGES.STAFF_NOT_THERAPIST);
  }

  const totalDays = Number(payload.totalDays);
  const totalFees = Number(payload.totalFees);
  if (!totalDays || totalDays < 1) throw new Error('Number of days is required');
  if (!Number.isFinite(totalFees) || totalFees < 0) throw new Error('Treatment fees are required');

  const therapyType = payload.therapy?.trim() || payload.panchakarmaType?.trim() || 'Basti';
  const allowed = PANCHAKARMA_THERAPIES.includes(therapyType) ? therapyType : 'Basti';

  const dailySessions = (payload.dailySessions ?? []).map((row, index) => ({
    dayNumber: Number(row.dayNumber) || index + 1,
    sessionDate: row.sessionDate ? new Date(row.sessionDate) : null,
    time: row.time?.trim() || '',
    duration: row.duration?.trim() || '',
    panchakarmaType: row.panchakarmaType?.trim() || therapyType,
    medicineContent: row.medicineContent?.trim() || '',
  }));

  let room;
  if (payload.roomCode) {
    room = await assertRoomHasCapacity(payload.roomCode, 'Panchakarma');
  } else {
    const availableRooms = await listRoomsWithOccupancy({
      roomType: 'Panchakarma',
      activeOnly: true,
    });
    room = availableRooms.find((r) => r.available > 0);
    if (!room) throw new Error(PANCHAKARMA_MESSAGES.ROOM_UNAVAILABLE);
  }

  let program = await HmsPanchakarmaProgram.findOne({ appointmentCode });
  if (program) {
    program.treatmentName = payload.treatmentName?.trim() || program.treatmentName;
    program.totalFees = totalFees;
    program.totalDays = totalDays;
    program.dailySessions = dailySessions;
    program.status = 'Ongoing';
    await program.save();
  } else {
    program = await HmsPanchakarmaProgram.create({
      programCode: await generatePanchakarmaCode(),
      patientCode: appointment.patientCode,
      patient: appointment.patient,
      patientName: appointment.patientName,
      staffCode: therapist.staffCode,
      staff: therapist._id,
      therapistName: therapist.name,
      therapy: allowed,
      treatmentName: payload.treatmentName?.trim() || therapyType,
      totalFees,
      amountPaid: 0,
      totalDays,
      currentDay: 1,
      roomCode: room.code,
      room: room.name,
      startDate: normalizeProgramStartDate(payload.startDate || new Date()),
      appointmentCode,
      dailySessions,
      status: 'Ongoing',
      createdBy: {
        type: req.accountType === 'admin' ? 'admin' : 'patient',
        adminId: req.admin?._id,
        patientCode: appointment.patientCode,
        name: therapist.name,
      },
    });
  }

  if (appointment.status !== 'Completed') {
    appointment.status = 'Completed';
    appointment.attendedAt = new Date();
    appointment.attendedBy = {
      type: 'staff',
      staffCode: therapist.staffCode,
      name: therapist.name,
    };
    await appointment.save();
  }

  await syncProgramToPatientCare(program);
  await syncPanchakarmaTreatmentHistory(program);

  const invoice = await createPanchakarmaInvoice(program, req, {
    markPaid: payload.markPaid === true,
    paymentMethod: payload.paymentMethod,
    payAmount: payload.payAmount,
  });

  return {
    program: formatHmsPanchakarmaProgram(program),
    invoice,
  };
};

export const getProgramByCode = async (programCode) => {
  const row = await HmsPanchakarmaProgram.findOne({ programCode });
  if (!row) throw new Error(PANCHAKARMA_MESSAGES.NOT_FOUND);
  return formatHmsPanchakarmaProgram(row);
};
