import { customResponse } from '../../utils/response.js';
import { ErrorMessages, PANCHAKARMA_MESSAGES } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';
import { resolveApiErrorMessage } from '../../utils/resolveApiErrorMessage.js';
import {
  listPrograms,
  listProgramsByStaff,
  getPanchakarmaStats,
  listTherapistsForPanchakarma,
  listRoomsStatus,
  createProgram,
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

export const getPrograms = async (_req, res) => {
  try {
    const programs = await listPrograms();
    return customResponse(res, PANCHAKARMA_MESSAGES.LIST_FETCHED, 200, { programs });
  } catch (error) {
    logger.error('List panchakarma programs error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getProgramsStats = async (_req, res) => {
  try {
    const stats = await getPanchakarmaStats();
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

export const getTherapists = async (_req, res) => {
  try {
    const therapists = await listTherapistsForPanchakarma();
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
    const createdBy = {
      type: 'admin',
      adminId: req.admin?._id,
      name: req.admin?.name || 'Admin',
    };

    const program = await createProgram(
      {
        patientCode: req.body.patientCode,
        staffCode: req.body.staffCode,
        therapy: req.body.therapy,
        totalDays: req.body.totalDays,
        room: req.body.room,
        startDate: req.body.startDate,
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
