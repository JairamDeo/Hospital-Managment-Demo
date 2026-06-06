import { customResponse } from '../../utils/response.js';
import { PATIENT_MESSAGES } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';
import { resolveApiErrorMessage } from '../../utils/resolveApiErrorMessage.js';
import {
  createStructuredPrescription,
  generateStructuredPrescriptionPdf,
  getStructuredPrescription,
  listStructuredPrescriptions,
} from '../services/hmsStructuredPrescription.service.js';

const decodeParam = (param) => decodeURIComponent(param ?? '');

export const getStructuredPrescriptions = async (req, res) => {
  try {
    const prescriptions = await listStructuredPrescriptions(decodeParam(req.params.patientCode));
    return customResponse(res, PATIENT_MESSAGES.PRESCRIPTIONS_FETCHED, 200, { prescriptions });
  } catch (error) {
    logger.error('List structured prescriptions error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postStructuredPrescription = async (req, res) => {
  try {
    const prescription = await createStructuredPrescription(
      decodeParam(req.params.patientCode),
      req.body,
      req
    );
    return customResponse(res, 'Prescription saved successfully', 201, { prescription });
  } catch (error) {
    logger.error('Create structured prescription error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 400);
  }
};

export const getStructuredPrescriptionPdf = async (req, res) => {
  try {
    const includeCombination = req.query.audience !== 'patient';
    const file = await generateStructuredPrescriptionPdf(
      decodeParam(req.params.patientCode),
      decodeParam(req.params.prescriptionCode),
      { includeCombination }
    );
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    return res.send(file.buffer);
  } catch (error) {
    if (error.message === PATIENT_MESSAGES.PRESCRIPTION_NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    logger.error('Prescription PDF error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getStructuredPrescriptionByCode = async (req, res) => {
  try {
    const prescription = await getStructuredPrescription(
      decodeParam(req.params.patientCode),
      decodeParam(req.params.prescriptionCode)
    );
    return customResponse(res, 'Prescription fetched successfully', 200, { prescription });
  } catch (error) {
    if (error.message === PATIENT_MESSAGES.PRESCRIPTION_NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    logger.error('Get structured prescription error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};
