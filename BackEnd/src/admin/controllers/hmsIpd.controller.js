import { customResponse } from '../../utils/response.js';
import { ErrorMessages, IPD_MESSAGES } from '../../utils/constants.js';
import {
  listIpdAdmissions,
  getIpdStats,
  listIpdRoomsStatus,
  getIpdAdmissionByCode,
  createIpdAdmission,
  addIpdCaseNote,
  dischargeIpdPatient,
} from '../services/hmsIpd.service.js';

const mapIpdError = (message) => {
  if (message === IPD_MESSAGES.NOT_FOUND) return 404;
  if (
    message === IPD_MESSAGES.PATIENT_ALREADY_ADMITTED ||
    message === IPD_MESSAGES.ALREADY_DISCHARGED ||
    message === IPD_MESSAGES.ROOM_AT_CAPACITY ||
    message === IPD_MESSAGES.ROOM_NOT_FOUND ||
    message === IPD_MESSAGES.ROOM_TYPE_MISMATCH
  ) {
    return 409;
  }
  if (message === IPD_MESSAGES.STAFF_NOT_DOCTOR || message === ErrorMessages.PATIENT_NOT_FOUND) {
    return 400;
  }
  return 500;
};

export const getAdmissions = async (req, res) => {
  try {
    const admissions = await listIpdAdmissions(req.query.status);
    return customResponse(res, IPD_MESSAGES.LIST_FETCHED, 200, { admissions });
  } catch (error) {
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const getStats = async (_req, res) => {
  try {
    const stats = await getIpdStats();
    return customResponse(res, IPD_MESSAGES.STATS_FETCHED, 200, { stats });
  } catch {
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const getRooms = async (_req, res) => {
  try {
    const rooms = await listIpdRoomsStatus();
    return customResponse(res, IPD_MESSAGES.ROOMS_FETCHED, 200, { rooms });
  } catch {
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const getAdmission = async (req, res) => {
  try {
    const admission = await getIpdAdmissionByCode(req.params.admissionCode);
    return customResponse(res, IPD_MESSAGES.FETCHED, 200, { admission });
  } catch (error) {
    const status = mapIpdError(error.message);
    return customResponse(res, error.message || ErrorMessages.SERVER_ERROR, status);
  }
};

export const postAdmission = async (req, res) => {
  try {
    const admission = await createIpdAdmission(req.body, req);
    return customResponse(res, IPD_MESSAGES.CREATED, 201, { admission });
  } catch (error) {
    const status = mapIpdError(error.message);
    return customResponse(res, error.message || ErrorMessages.SERVER_ERROR, status);
  }
};

export const postCaseNote = async (req, res) => {
  try {
    const admission = await addIpdCaseNote(req.params.admissionCode, req.body, req);
    return customResponse(res, IPD_MESSAGES.CASE_NOTE_ADDED, 200, { admission });
  } catch (error) {
    const status = mapIpdError(error.message);
    return customResponse(res, error.message || ErrorMessages.SERVER_ERROR, status);
  }
};

export const postDischarge = async (req, res) => {
  try {
    const admission = await dischargeIpdPatient(req.params.admissionCode, req.body, req);
    return customResponse(res, IPD_MESSAGES.DISCHARGED, 200, { admission });
  } catch (error) {
    const status = mapIpdError(error.message);
    return customResponse(res, error.message || ErrorMessages.SERVER_ERROR, status);
  }
};
