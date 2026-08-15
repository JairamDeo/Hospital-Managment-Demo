import { customResponse } from '../../utils/response.js';
import { ErrorMessages, PANCHAKARMA_MESSAGES } from '../../utils/constants.js';
import { assertStaffCanAccessPatient } from '../../utils/staffPatientScope.util.js';
import { logger } from '../../utils/logger.js';
import { resolveApiErrorMessage } from '../../utils/resolveApiErrorMessage.js';
import {
  listPrograms,
  listProgramsByStaff,
  listProgramsByPatient,
  getPanchakarmaStats,
  listTherapistsForPanchakarma,
  listRoomsStatus,
  createProgram,
  attendPanchakarmaProgram,
  createTreatmentPlanFromAppointment,
  getProgramByCode,
} from '../services/hmsPanchakarma.service.js';

const decodeParam = (param) => decodeURIComponent(param ?? '');

const programErrorStatus = (message) => {
  if (message === PANCHAKARMA_MESSAGES.ROOM_UNAVAILABLE) return 409;
  if (message === PANCHAKARMA_MESSAGES.STAFF_NOT_THERAPIST) return 400;
  if (
    message === ErrorMessages.PATIENT_NOT_FOUND ||
    message === ErrorMessages.THERAPIST_NOT_FOUND
  ) {
    return 404;
  }
  return 500;
};

export const getPrograms = async (req, res) => {
  try {
    const staffCode =
      req.accountType === 'staff' && req.staff?.role === 'Therapist'
        ? req.staff.staffCode
        : null;
    const programs = await listPrograms(staffCode);
    return customResponse(res, PANCHAKARMA_MESSAGES.LIST_FETCHED, 200, { programs });
  } catch (error) {
    logger.error('List panchakarma programs error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getProgramsStats = async (req, res) => {
  try {
    const staffCode =
      req.accountType === 'staff' && req.staff?.role === 'Therapist'
        ? req.staff.staffCode
        : null;
    const stats = await getPanchakarmaStats(staffCode);
    return customResponse(res, PANCHAKARMA_MESSAGES.STATS_FETCHED, 200, { stats });
  } catch (error) {
    logger.error('Panchakarma stats error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getStaffPrograms = async (req, res) => {
  try {
    const programs = await listProgramsByStaff(decodeParam(req.params.staffCode));
    return customResponse(res, PANCHAKARMA_MESSAGES.LIST_FETCHED, 200, { programs });
  } catch (error) {
    logger.error('Staff panchakarma programs error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getPatientPrograms = async (req, res) => {
  try {
    const patientCode = decodeParam(req.params.patientCode);
    await assertStaffCanAccessPatient(req, patientCode);
    const staffCode =
      req.accountType === 'staff' && req.staff?.role === 'Therapist'
        ? req.staff.staffCode
        : null;
    const programs = await listProgramsByPatient(patientCode, staffCode);
    return customResponse(res, PANCHAKARMA_MESSAGES.LIST_FETCHED, 200, { programs });
  } catch (error) {
    if (error.message === ErrorMessages.ACCESS_DENIED) {
      return customResponse(res, error.message, 403);
    }
    logger.error('Patient panchakarma programs error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getTherapists = async (req, res) => {
  try {
    const staffCode =
      req.accountType === 'staff' && req.staff?.role === 'Therapist'
        ? req.staff.staffCode
        : null;
    const therapists = await listTherapistsForPanchakarma(staffCode);
    return customResponse(res, PANCHAKARMA_MESSAGES.THERAPISTS_FETCHED, 200, { therapists });
  } catch (error) {
    logger.error('Panchakarma therapists error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getRooms = async (_req, res) => {
  try {
    const rooms = await listRoomsStatus();
    return customResponse(res, PANCHAKARMA_MESSAGES.ROOMS_FETCHED, 200, { rooms });
  } catch (error) {
    logger.error('Panchakarma rooms error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postProgram = async (req, res) => {
  try {
    if (req.accountType === 'staff' && req.staff?.role === 'Therapist') {
      return customResponse(res, ErrorMessages.ACCESS_DENIED, 403);
    }

    const createdBy = {
      type: 'admin',
      adminId: req.admin?._id,
      name: req.admin?.name || req.staff?.name || 'Staff',
    };

    const staffCode = req.body.staffCode;

    const program = await createProgram(
      {
        patientCode: req.body.patientCode,
        staffCode,
        therapy: req.body.therapy,
        totalDays: req.body.totalDays,
        roomCode: req.body.roomCode,
        startDate: req.body.startDate,
        treatmentName: req.body.treatmentName,
        totalFees: req.body.totalFees,
        dailySessions: req.body.dailySessions,
      },
      createdBy
    );

    return customResponse(res, PANCHAKARMA_MESSAGES.CREATED, 201, { program });
  } catch (error) {
    const status = programErrorStatus(error.message);
    if (status !== 500) {
      return customResponse(res, error.message, status);
    }
    logger.error('Create panchakarma program error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postTreatmentPlanFromAppointment = async (req, res) => {
  try {
    const result = await createTreatmentPlanFromAppointment(
      decodeParam(req.params.appointmentCode),
      req.body,
      req
    );
    return customResponse(res, PANCHAKARMA_MESSAGES.PLAN_CREATED, 201, result);
  } catch (error) {
    const status = programErrorStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Create treatment plan error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getProgram = async (req, res) => {
  try {
    const program = await getProgramByCode(decodeParam(req.params.programCode));
    return customResponse(res, PANCHAKARMA_MESSAGES.LIST_FETCHED, 200, { program });
  } catch (error) {
    if (error.message === PANCHAKARMA_MESSAGES.NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    logger.error('Get program error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postAttendProgram = async (req, res) => {
  try {
    const program = await attendPanchakarmaProgram(
      decodeParam(req.params.programCode),
      req.body,
      req
    );
    return customResponse(res, PANCHAKARMA_MESSAGES.ATTENDED, 200, { program });
  } catch (error) {
    if (error.message === ErrorMessages.ACCESS_DENIED) {
      return customResponse(res, error.message, 403);
    }
    if (error.message === PANCHAKARMA_MESSAGES.NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    if (
      error.message === 'This program cannot be updated' ||
      error.message === 'Daily session schedule is required' ||
      error.message === 'Total fees is required'
    ) {
      return customResponse(res, error.message, 400);
    }
    logger.error('Attend panchakarma program error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};
