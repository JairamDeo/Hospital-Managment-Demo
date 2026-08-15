import { customResponse } from '../../utils/response.js';
import { PATIENT_MESSAGES, ErrorMessages } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';
import { resolveApiErrorMessage } from '../../utils/resolveApiErrorMessage.js';
import { addPatientVitals, listPatientVitalsHistory } from '../services/patientVitals.service.js';

const decodeParam = (param) => decodeURIComponent(param ?? '');

export const getPatientVitalsHistory = async (req, res) => {
  try {
    const vitalsHistory = await listPatientVitalsHistory(decodeParam(req.params.patientCode));
    return customResponse(res, 'Vitals history fetched successfully', 200, { vitalsHistory });
  } catch (error) {
    logger.error('List vitals error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postPatientVitals = async (req, res) => {
  try {
    const result = await addPatientVitals(decodeParam(req.params.patientCode), req.body, req);
    return customResponse(res, PATIENT_MESSAGES.VITALS_ADDED, 201, result);
  } catch (error) {
    if (error.message === ErrorMessages.PATIENT_NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    logger.error('Add vitals error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 400);
  }
};
