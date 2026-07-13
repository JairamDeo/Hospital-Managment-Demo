import { customResponse } from '../../utils/response.js';
import { ErrorMessages, PATIENT_MESSAGES, BILLING_MESSAGES } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';
import { resolveApiErrorMessage } from '../../utils/resolveApiErrorMessage.js';
import {
  sendStructuredPrescriptionWhatsApp,
  sendUploadedPrescriptionWhatsApp,
  sendInvoiceWhatsApp,
} from '../services/patientWhatsApp.service.js';
import {
  sendStructuredPrescriptionEmail,
  sendUploadedPrescriptionEmail,
  sendInvoiceEmailToPatient,
} from '../services/patientMail.service.js';

const decodeParam = (param) => decodeURIComponent(param ?? '');

const notificationErrorStatus = (message) => {
  if (
    message === PATIENT_MESSAGES.NO_WHATSAPP_NUMBER ||
    message === PATIENT_MESSAGES.NO_EMAIL_ADDRESS ||
    message === PATIENT_MESSAGES.WHATSAPP_ALREADY_SENT
  ) {
    return 400;
  }
  if (message === ErrorMessages.PATIENT_NOT_FOUND) return 404;
  if (message === PATIENT_MESSAGES.PRESCRIPTION_NOT_FOUND) return 404;
  if (message === 'Invoice not found') return 404;
  if (/not configured|cloudinary/i.test(String(message))) return 503;
  return 500;
};

const buildNotificationResponse = (waResult, emailResult) => {
  const waOk = waResult.status === 'fulfilled';
  const emailOk = emailResult.status === 'fulfilled';

  if (!waOk && !emailOk) {
    const err = waResult.reason || emailResult.reason;
    throw err instanceof Error ? err : new Error(String(err));
  }

  return {
    whatsappSent: waOk,
    emailSent: emailOk,
    whatsapp: waOk
      ? waResult.value
      : { skipped: true, reason: waResult.reason?.message || 'WhatsApp failed' },
    email: emailOk
      ? emailResult.value
      : { skipped: true, reason: emailResult.reason?.message || 'Email failed' },
  };
};

export const postStructuredPrescriptionWhatsApp = async (req, res) => {
  try {
    const patientCode = decodeParam(req.params.patientCode);
    const prescriptionCode = decodeParam(req.params.prescriptionCode);
    const audience = req.body?.audience === 'staff' ? 'staff' : 'patient';

    const [waResult, emailResult] = await Promise.allSettled([
      sendStructuredPrescriptionWhatsApp(patientCode, prescriptionCode, { audience, req }),
      sendStructuredPrescriptionEmail(patientCode, prescriptionCode, { audience }),
    ]);

    const result = buildNotificationResponse(waResult, emailResult);
    return customResponse(res, PATIENT_MESSAGES.NOTIFICATION_SENT, 200, result);
  } catch (error) {
    const status = notificationErrorStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Structured prescription notification error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postUploadedPrescriptionWhatsApp = async (req, res) => {
  try {
    const patientCode = decodeParam(req.params.patientCode);
    const prescriptionId = decodeParam(req.params.prescriptionId);

    const [waResult, emailResult] = await Promise.allSettled([
      sendUploadedPrescriptionWhatsApp(patientCode, prescriptionId),
      sendUploadedPrescriptionEmail(patientCode, prescriptionId),
    ]);

    const result = buildNotificationResponse(waResult, emailResult);
    return customResponse(res, PATIENT_MESSAGES.NOTIFICATION_SENT, 200, result);
  } catch (error) {
    const status = notificationErrorStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Uploaded prescription notification error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postInvoiceWhatsApp = async (req, res) => {
  try {
    const invoiceCode = decodeParam(req.params.invoiceCode);
    if (!req.file?.buffer) {
      return customResponse(res, 'Invoice document file is required (PDF, JPG, or PNG)', 400);
    }

    const docOpts = {
      documentBuffer: req.file.buffer,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
    };

    const [waResult, emailResult] = await Promise.allSettled([
      sendInvoiceWhatsApp(invoiceCode, docOpts),
      sendInvoiceEmailToPatient(invoiceCode, docOpts),
    ]);

    const result = buildNotificationResponse(waResult, emailResult);
    return customResponse(res, PATIENT_MESSAGES.NOTIFICATION_SENT, 200, result);
  } catch (error) {
    const status = notificationErrorStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Invoice notification error:', error);
    return customResponse(res, resolveApiErrorMessage(error, BILLING_MESSAGES.NOT_FOUND), 500);
  }
};
