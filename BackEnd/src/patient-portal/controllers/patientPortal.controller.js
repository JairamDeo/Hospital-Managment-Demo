import { customResponse } from '../../utils/response.js';
import { logger } from '../../utils/logger.js';
import { ErrorMessages, PATIENT_PORTAL_MESSAGES } from '../../utils/constants.js';
import {
  registerPatientSelf,
  sendPatientLoginOtp,
  resendPatientLoginOtp,
  verifyPatientOtp,
  getPatientProfile,
  updatePatientProfile,
} from '../services/patientPortal.service.js';
import { listPrakriti, listTreatments } from '../../admin/services/master.service.js';
import { resolveApiErrorMessage } from '../../utils/resolveApiErrorMessage.js';
import { isMongoDuplicateKeyError } from '../../utils/patientContact.util.js';
import { PATIENT_MESSAGES } from '../../utils/constants.js';

const isContactConflict = (error) =>
  error.message === PATIENT_PORTAL_MESSAGES.MOBILE_ALREADY_REGISTERED ||
  error.message === PATIENT_PORTAL_MESSAGES.EMAIL_ALREADY_REGISTERED ||
  error.message === PATIENT_MESSAGES.MOBILE_ALREADY_REGISTERED ||
  error.message === PATIENT_MESSAGES.EMAIL_ALREADY_REGISTERED ||
  isMongoDuplicateKeyError(error);

const otpError = (res, error) => {
  if (error.message === PATIENT_PORTAL_MESSAGES.MOBILE_NOT_REGISTERED) {
    return customResponse(res, error.message, 404);
  }
  if (error.message === PATIENT_PORTAL_MESSAGES.RESEND_COOLDOWN) {
    return customResponse(res, error.message, 429, { waitSeconds: error.waitSeconds });
  }
  if (error.message === PATIENT_PORTAL_MESSAGES.SMS_SEND_FAILED) {
    return customResponse(res, error.message, 502);
  }
  return null;
};

export const patientRegister = async (req, res) => {
  try {
    const body = {
      ...req.body,
      prakritiId: req.body.prakritiId || null,
      treatmentId: req.body.treatmentId || null,
    };
    const result = await registerPatientSelf(body);
    return customResponse(res, result.message, 201, {
      mobileNumber: result.mobileNumber,
      expiresInSeconds: result.expiresInSeconds,
      resendAfterSeconds: result.resendAfterSeconds,
    });
  } catch (error) {
    if (isContactConflict(error)) {
      return customResponse(res, resolveApiErrorMessage(error), 409);
    }
    const otp = otpError(res, error);
    if (otp) return otp;
    logger.error('Patient register error:', error);
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const patientSendOtp = async (req, res) => {
  try {
    const result = await sendPatientLoginOtp(req.body.mobileNumber);
    return customResponse(res, result.message, 200, {
      expiresInSeconds: result.expiresInSeconds,
      resendAfterSeconds: result.resendAfterSeconds,
    });
  } catch (error) {
    const otp = otpError(res, error);
    if (otp) return otp;
    if (error.message === PATIENT_PORTAL_MESSAGES.ACCOUNT_INACTIVE) {
      return customResponse(res, error.message, 403);
    }
    logger.error('Patient send OTP error:', error);
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const patientResendOtp = async (req, res) => {
  try {
    const result = await resendPatientLoginOtp(req.body.mobileNumber);
    return customResponse(res, PATIENT_PORTAL_MESSAGES.OTP_RESENT, 200, {
      expiresInSeconds: result.expiresInSeconds,
      resendAfterSeconds: result.resendAfterSeconds,
    });
  } catch (error) {
    const otp = otpError(res, error);
    if (otp) return otp;
    logger.error('Patient resend OTP error:', error);
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const patientVerifyOtp = async (req, res) => {
  try {
    const result = await verifyPatientOtp(req.body.mobileNumber, req.body.otp);
    return customResponse(res, result.message, 200, {
      token: result.token,
      patient: result.patient,
    });
  } catch (error) {
    if (
      error.message === PATIENT_PORTAL_MESSAGES.OTP_INVALID ||
      error.message === PATIENT_PORTAL_MESSAGES.OTP_EXPIRED
    ) {
      return customResponse(res, error.message, 400);
    }
    logger.error('Patient verify OTP error:', error);
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const patientMe = async (req, res) => {
  try {
    const patient = await getPatientProfile(req.user.id);
    return customResponse(res, PATIENT_PORTAL_MESSAGES.PROFILE_FETCHED, 200, { patient });
  } catch (error) {
    if (error.message === ErrorMessages.USER_NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const patientUpdateMe = async (req, res) => {
  try {
    const body = {
      ...req.body,
      prakritiId: req.body.prakritiId === '' ? null : req.body.prakritiId,
      treatmentId: req.body.treatmentId === '' ? null : req.body.treatmentId,
    };
    const patient = await updatePatientProfile(req.user.id, body);
    return customResponse(res, PATIENT_PORTAL_MESSAGES.PROFILE_UPDATED, 200, { patient });
  } catch (error) {
    if (isContactConflict(error)) {
      return customResponse(res, resolveApiErrorMessage(error), 409);
    }
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const patientMasters = async (_req, res) => {
  try {
    const [prakriti, treatments] = await Promise.all([
      listPrakriti(true),
      listTreatments(true),
    ]);
    return customResponse(res, 'Master data fetched', 200, { prakriti, treatments });
  } catch (error) {
    logger.error('Patient masters error:', error);
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};
