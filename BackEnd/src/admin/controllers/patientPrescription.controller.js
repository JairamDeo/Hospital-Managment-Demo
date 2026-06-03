import { customResponse } from '../../utils/response.js';
import { ErrorMessages, PATIENT_MESSAGES } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';
import { resolveApiErrorMessage } from '../../utils/resolveApiErrorMessage.js';
import { fetchRawPdfStream } from '../../services/cloudinary.service.js';
import {
  listPatientPrescriptions,
  uploadPatientPrescription,
  deletePatientPrescription,
  getPatientPrescriptionDoc,
} from '../services/patientPrescription.service.js';

const decodePatientCode = (param) => decodeURIComponent(param ?? '');

export const getPatientPrescriptions = async (req, res) => {
  try {
    const prescriptions = await listPatientPrescriptions(
      decodePatientCode(req.params.patientCode)
    );
    return customResponse(res, PATIENT_MESSAGES.PRESCRIPTIONS_FETCHED, 200, { prescriptions });
  } catch (error) {
    if (error.message === ErrorMessages.PATIENT_NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    logger.error('List prescriptions error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postPatientPrescription = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return customResponse(res, PATIENT_MESSAGES.PRESCRIPTION_FILE_REQUIRED, 400);
    }
    const prescription = await uploadPatientPrescription(
      decodePatientCode(req.params.patientCode),
      req.file,
      req.body?.title
    );
    return customResponse(res, PATIENT_MESSAGES.PRESCRIPTION_UPLOADED, 201, { prescription });
  } catch (error) {
    if (error.message === ErrorMessages.PATIENT_NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    if (/cloudinary|configured/i.test(String(error.message))) {
      return customResponse(res, error.message, 503);
    }
    logger.error('Upload prescription error:', error);
    return customResponse(
      res,
      resolveApiErrorMessage(error, 'Could not upload prescription PDF.'),
      500
    );
  }
};

export const viewPatientPrescriptionPdf = async (req, res) => {
  try {
    const doc = await getPatientPrescriptionDoc(
      decodePatientCode(req.params.patientCode),
      req.params.prescriptionId
    );
    const { data, headers } = await fetchRawPdfStream(
      doc.cloudinaryPublicId,
      doc.cloudinaryUrl
    );
    const safeName = String(doc.fileName || 'prescription.pdf').replace(/[^\w.\- ]/g, '_');
    res.setHeader('Content-Type', headers['content-type'] || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
    res.setHeader('Cache-Control', 'private, max-age=300');
    data.pipe(res);
  } catch (error) {
    if (error.message === ErrorMessages.PATIENT_NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    if (error.message === 'Prescription not found') {
      return customResponse(res, error.message, 404);
    }
    logger.error('View prescription PDF error:', error);
    if (!res.headersSent) {
      return customResponse(res, resolveApiErrorMessage(error, 'Could not load PDF.'), 500);
    }
  }
};

export const deletePatientPrescriptionHandler = async (req, res) => {
  try {
    await deletePatientPrescription(
      decodePatientCode(req.params.patientCode),
      req.params.prescriptionId
    );
    return customResponse(res, PATIENT_MESSAGES.PRESCRIPTION_DELETED, 200, { deleted: true });
  } catch (error) {
    if (error.message === ErrorMessages.PATIENT_NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    if (error.message === 'Prescription not found') {
      return customResponse(res, error.message, 404);
    }
    logger.error('Delete prescription error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};
