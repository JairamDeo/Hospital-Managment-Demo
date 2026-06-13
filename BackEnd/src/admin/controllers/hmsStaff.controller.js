import { customResponse } from '../../utils/response.js';
import { ErrorMessages, STAFF_MESSAGES } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';
import { resolveApiErrorMessage } from '../../utils/resolveApiErrorMessage.js';
import {
  listStaff,
  getStaffByCode,
  getStaffStats,
  createStaffByAdmin,
  updateStaffByAdmin,
  listStaffCompensation,
  updateStaffCompensation,
} from '../services/hmsStaff.service.js';

const decodeStaffCode = (param) => decodeURIComponent(param ?? '');

export const getStaffList = async (_req, res) => {
  try {
    const staff = await listStaff();
    return customResponse(res, STAFF_MESSAGES.LIST_FETCHED, 200, { staff });
  } catch (error) {
    logger.error('List staff error:', error);
    return customResponse(
      res,
      resolveApiErrorMessage(error, 'Could not load staff. Please refresh and try again.'),
      500
    );
  }
};

export const getStaffStatsSummary = async (_req, res) => {
  try {
    const stats = await getStaffStats();
    return customResponse(res, STAFF_MESSAGES.STATS_FETCHED, 200, { stats });
  } catch (error) {
    logger.error('Staff stats error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getStaff = async (req, res) => {
  try {
    const member = await getStaffByCode(decodeStaffCode(req.params.staffCode));
    if (!member) {
      return customResponse(res, ErrorMessages.STAFF_NOT_FOUND, 404);
    }
    return customResponse(res, STAFF_MESSAGES.FETCHED, 200, { staff: member });
  } catch (error) {
    logger.error('Get staff error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postStaff = async (req, res) => {
  try {
    const staff = await createStaffByAdmin(req.body);
    return customResponse(res, STAFF_MESSAGES.CREATED, 201, { staff });
  } catch (error) {
    logger.error('Create staff error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getStaffCompensationList = async (_req, res) => {
  try {
    const rows = await listStaffCompensation();
    return customResponse(res, STAFF_MESSAGES.COMPENSATION_LIST_FETCHED, 200, { rows });
  } catch (error) {
    logger.error('List staff compensation error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const patchStaffCompensation = async (req, res) => {
  try {
    const row = await updateStaffCompensation(decodeStaffCode(req.params.staffCode), req.body);
    return customResponse(res, STAFF_MESSAGES.COMPENSATION_UPDATED, 200, { row });
  } catch (error) {
    if (error.message === ErrorMessages.STAFF_NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    logger.error('Update staff compensation error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const patchStaff = async (req, res) => {
  try {
    const staff = await updateStaffByAdmin(decodeStaffCode(req.params.staffCode), req.body);
    return customResponse(res, STAFF_MESSAGES.UPDATED, 200, { staff });
  } catch (error) {
    if (error.message === ErrorMessages.STAFF_NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    logger.error('Update staff error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};
