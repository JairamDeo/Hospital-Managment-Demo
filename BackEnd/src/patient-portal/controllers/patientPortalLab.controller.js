import { customResponse } from '../../utils/response.js';
import { LAB_MESSAGES, ErrorMessages } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';
import { resolveApiErrorMessage } from '../../utils/resolveApiErrorMessage.js';
import { listLabReports, uploadLabReport, listLabOrders } from '../../admin/services/hmsLab.service.js';
import { listLabTestCategories, listLabTests } from '../../admin/services/master.service.js';

export const patientListLabReports = async (req, res) => {
  try {
    const reports = await listLabReports({ patientCode: req.patient.patientCode });
    return customResponse(res, LAB_MESSAGES.REPORTS_FETCHED, 200, { reports });
  } catch (error) {
    logger.error('Patient lab reports error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const patientListLabOrders = async (req, res) => {
  try {
    const orders = await listLabOrders({ patientCode: req.patient.patientCode });
    return customResponse(res, LAB_MESSAGES.ORDERS_FETCHED, 200, { orders });
  } catch (error) {
    logger.error('Patient lab orders error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const patientListLabMasters = async (_req, res) => {
  try {
    const [categories, tests] = await Promise.all([
      listLabTestCategories(true),
      listLabTests(true),
    ]);
    return customResponse(res, 'Lab masters fetched', 200, { categories, tests });
  } catch (error) {
    logger.error('Patient lab masters error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const patientUploadLabReport = async (req, res) => {
  try {
    const report = await uploadLabReport(
      {
        ...req.body,
        patientCode: req.patient.patientCode,
      },
      req.file,
      req
    );
    return customResponse(res, LAB_MESSAGES.REPORT_UPLOADED, 201, { report });
  } catch (error) {
    const known = [
      LAB_MESSAGES.TESTS_REQUIRED,
      LAB_MESSAGES.FILE_REQUIRED,
      LAB_MESSAGES.ORDER_REQUIRED,
      LAB_MESSAGES.ALREADY_UPLOADED,
      LAB_MESSAGES.ORDER_MISMATCH,
      ErrorMessages.PATIENT_NOT_FOUND,
    ];
    if (known.includes(error.message)) {
      return customResponse(res, error.message, 400);
    }
    if (/cloudinary|not configured/i.test(String(error.message))) {
      return customResponse(res, error.message, 503);
    }
    logger.error('Patient lab upload error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};
