import { customResponse } from '../../utils/response.js';
import { ErrorMessages } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';
import { resolveApiErrorMessage } from '../../utils/resolveApiErrorMessage.js';
import {
  listStaffActivity,
  staffCheckIn,
  staffCheckOut,
  listStaffDocuments,
  uploadStaffDocument,
  getStaffDocumentFile,
  listStaffLeave,
  applyStaffLeave,
  listPendingLeave,
  approveStaffLeave,
  rejectStaffLeave,
  countLeaveDaysExcludingSunday,
} from '../services/staffProfile.service.js';

const accessStatus = (message) => {
  if (message === ErrorMessages.ACCESS_DENIED) return 403;
  if (message === ErrorMessages.STAFF_NOT_FOUND || message.includes('not found')) return 404;
  if (message.includes('already processed') || message.includes('working day')) return 409;
  return 500;
};

export const getActivity = async (req, res) => {
  try {
    const activity = await listStaffActivity(req, req.params.staffCode);
    return customResponse(res, 'Activity log fetched', 200, { activity });
  } catch (error) {
    const status = accessStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Staff activity error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postCheckIn = async (req, res) => {
  try {
    const activity = await staffCheckIn(req, req.params.staffCode);
    return customResponse(res, 'Checked in successfully', 201, { activity });
  } catch (error) {
    const status = accessStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Check-in error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postCheckOut = async (req, res) => {
  try {
    const activity = await staffCheckOut(req, req.params.staffCode);
    return customResponse(res, 'Checked out successfully', 201, { activity });
  } catch (error) {
    const status = accessStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Check-out error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getDocuments = async (req, res) => {
  try {
    const documents = await listStaffDocuments(req, req.params.staffCode);
    return customResponse(res, 'Documents fetched', 200, { documents });
  } catch (error) {
    const status = accessStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Staff documents error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postDocument = async (req, res) => {
  try {
    const document = await uploadStaffDocument(
      req,
      req.params.staffCode,
      req.file,
      req.body?.title
    );
    return customResponse(res, 'Document uploaded', 201, { document });
  } catch (error) {
    const status = accessStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Upload document error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const downloadDocument = async (req, res) => {
  try {
    const { doc, absPath } = await getStaffDocumentFile(
      req,
      req.params.staffCode,
      req.params.docId
    );
    return res.download(absPath, doc.name);
  } catch (error) {
    const status = accessStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Download document error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getLeave = async (req, res) => {
  try {
    const leave = await listStaffLeave(req, req.params.staffCode);
    return customResponse(res, 'Leave records fetched', 200, { leave });
  } catch (error) {
    const status = accessStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Staff leave error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postLeave = async (req, res) => {
  try {
    const leave = await applyStaffLeave(req, req.params.staffCode, req.body);
    return customResponse(res, 'Leave application submitted', 201, { leave });
  } catch (error) {
    const status = accessStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Apply leave error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getPendingLeave = async (req, res) => {
  try {
    const pending = await listPendingLeave(req);
    return customResponse(res, 'Pending leave fetched', 200, { pending });
  } catch (error) {
    const status = accessStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Pending leave error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const patchApproveLeave = async (req, res) => {
  try {
    const leave = await approveStaffLeave(req, req.params.leaveId);
    return customResponse(res, 'Leave approved', 200, { leave });
  } catch (error) {
    const status = accessStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Approve leave error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const patchRejectLeave = async (req, res) => {
  try {
    const leave = await rejectStaffLeave(req, req.params.leaveId);
    return customResponse(res, 'Leave rejected', 200, { leave });
  } catch (error) {
    const status = accessStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Reject leave error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const previewLeaveDays = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const days = countLeaveDaysExcludingSunday(startDate, endDate);
    return customResponse(res, 'Leave days calculated', 200, { days });
  } catch (error) {
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};
