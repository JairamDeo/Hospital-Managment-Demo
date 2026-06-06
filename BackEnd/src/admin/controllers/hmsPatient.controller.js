import { customResponse } from '../../utils/response.js';
import { ErrorMessages, PATIENT_MESSAGES } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';
import { resolveApiErrorMessage } from '../../utils/resolveApiErrorMessage.js';
import { isMongoDuplicateKeyError } from '../../utils/patientContact.util.js';
import {
  listPatients,
  getPatientByCode,
  createPatientByAdmin,
  updatePatientByAdmin,
  getPatientClinicalByCode,
  updatePatientClinicalByCode,
} from '../services/hmsPatient.service.js';
import {
  getPatientStats,
  getPatientOverview,
} from '../services/hmsPatientOverview.service.js';

const isConflictError = (error) =>
  error.message === PATIENT_MESSAGES.MOBILE_ALREADY_REGISTERED ||
  error.message === PATIENT_MESSAGES.EMAIL_ALREADY_REGISTERED ||
  isMongoDuplicateKeyError(error);

const decodePatientCode = (param) => decodeURIComponent(param ?? '');

export const getPatientsStats = async (req, res) => {
  try {
    const stats = await getPatientStats(req);
    return customResponse(res, PATIENT_MESSAGES.LIST_FETCHED, 200, { stats });
  } catch (error) {
    logger.error('Patient stats error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getPatientOverviewHandler = async (req, res) => {
  try {
    const overview = await getPatientOverview(decodePatientCode(req.params.patientCode), req);
    return customResponse(res, PATIENT_MESSAGES.OVERVIEW_FETCHED, 200, overview);
  } catch (error) {
    if (error.message === ErrorMessages.PATIENT_NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    if (error.message === ErrorMessages.ACCESS_DENIED) {
      return customResponse(res, error.message, 403);
    }
    logger.error('Patient overview error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getPatients = async (req, res) => {
  try {
    const patients = await listPatients(req);
    return customResponse(res, PATIENT_MESSAGES.LIST_FETCHED, 200, { patients });
  } catch (error) {
    logger.error('List patients error:', error);
    return customResponse(
      res,
      resolveApiErrorMessage(error, 'Could not load patients. Please refresh and try again.'),
      500
    );
  }
};

export const getPatient = async (req, res) => {
  try {
    const patient = await getPatientByCode(decodePatientCode(req.params.patientCode), req);
    if (!patient) {
      return customResponse(res, ErrorMessages.PATIENT_NOT_FOUND, 404);
    }
    return customResponse(res, PATIENT_MESSAGES.FETCHED, 200, { patient });
  } catch (error) {
    if (error.message === ErrorMessages.ACCESS_DENIED) {
      return customResponse(res, error.message, 403);
    }
    logger.error('Get patient error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postPatient = async (req, res) => {
  try {
    const patient = await createPatientByAdmin(req.body);
    return customResponse(res, PATIENT_MESSAGES.CREATED, 201, { patient });
  } catch (error) {
    if (isConflictError(error)) {
      return customResponse(res, resolveApiErrorMessage(error), 409);
    }
    logger.error('Create patient error:', error);
    return customResponse(
      res,
      resolveApiErrorMessage(error, 'Could not add patient. Check the form and try again.'),
      500
    );
  }
};

export const getPatientClinical = async (req, res) => {
  try {
    const data = await getPatientClinicalByCode(decodePatientCode(req.params.patientCode), req);
    return customResponse(res, PATIENT_MESSAGES.CLINICAL_FETCHED, 200, data);
  } catch (error) {
    if (error.message === ErrorMessages.PATIENT_NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    if (error.message === ErrorMessages.ACCESS_DENIED) {
      return customResponse(res, error.message, 403);
    }
    logger.error('Get patient clinical error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const patchPatientClinical = async (req, res) => {
  try {
    const data = await updatePatientClinicalByCode(
      decodePatientCode(req.params.patientCode),
      req.body,
      req
    );
    return customResponse(res, PATIENT_MESSAGES.CLINICAL_UPDATED, 200, data);
  } catch (error) {
    if (error.message === ErrorMessages.PATIENT_NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    if (error.message === ErrorMessages.ACCESS_DENIED) {
      return customResponse(res, error.message, 403);
    }
    logger.error('Update patient clinical error:', error);
    return customResponse(
      res,
      resolveApiErrorMessage(error, 'Could not save patient info. Please try again.'),
      500
    );
  }
};

export const patchPatient = async (req, res) => {
  try {
    const patient = await updatePatientByAdmin(
      decodePatientCode(req.params.patientCode),
      req.body,
      req
    );
    return customResponse(res, PATIENT_MESSAGES.UPDATED, 200, { patient });
  } catch (error) {
    if (error.message === ErrorMessages.PATIENT_NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    if (error.message === ErrorMessages.ACCESS_DENIED) {
      return customResponse(res, error.message, 403);
    }
    if (isConflictError(error)) {
      return customResponse(res, resolveApiErrorMessage(error), 409);
    }
    logger.error('Update patient error:', error);
    return customResponse(
      res,
      resolveApiErrorMessage(error, 'Could not update patient. Please try again.'),
      500
    );
  }
};
