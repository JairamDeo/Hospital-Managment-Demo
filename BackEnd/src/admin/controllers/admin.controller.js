import { customResponse } from '../../utils/response.js';
import { logger } from '../../utils/logger.js';
import { ErrorMessages, ADMIN_MESSAGES } from '../../utils/constants.js';
import {
  loginAdmin,
  getAdminProfile,
  sendForgotPasswordOtp,
  resendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetAdminPassword,
} from '../services/admin.service.js';

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginAdmin(email, password);
    logger.info(`Admin logged in: ${email}`);
    return customResponse(res, ADMIN_MESSAGES.LOGIN_SUCCESS, 200, result);
  } catch (error) {
    if (
      error.message === ErrorMessages.INVALID_CREDENTIALS ||
      error.message === ADMIN_MESSAGES.ACCOUNT_INACTIVE
    ) {
      return customResponse(res, error.message, 401);
    }
    logger.error('Admin login error:', error);
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const adminMe = async (req, res) => {
  try {
    const user = await getAdminProfile(req.user.id, req.user.role);
    return customResponse(res, ADMIN_MESSAGES.PROFILE_FETCHED, 200, { user });
  } catch (error) {
    if (error.message === ErrorMessages.USER_NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    logger.error('Admin profile error:', error);
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const sendOtp = async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    const result = await sendForgotPasswordOtp(mobileNumber);
    return customResponse(res, result.message, 200, {
      expiresInSeconds: result.expiresInSeconds,
      resendAfterSeconds: result.resendAfterSeconds,
    });
  } catch (error) {
    if (error.message === ADMIN_MESSAGES.MOBILE_NOT_REGISTERED) {
      return customResponse(res, error.message, 404);
    }
    if (error.message === ADMIN_MESSAGES.RESEND_COOLDOWN) {
      return customResponse(res, error.message, 429, { waitSeconds: error.waitSeconds });
    }
    if (error.message === ADMIN_MESSAGES.SMS_SEND_FAILED) {
      return customResponse(res, error.message, 502);
    }
    logger.error('Send OTP error:', error);
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    const result = await resendForgotPasswordOtp(mobileNumber);
    return customResponse(res, ADMIN_MESSAGES.OTP_RESENT, 200, {
      expiresInSeconds: result.expiresInSeconds,
      resendAfterSeconds: result.resendAfterSeconds,
    });
  } catch (error) {
    if (error.message === ADMIN_MESSAGES.MOBILE_NOT_REGISTERED) {
      return customResponse(res, error.message, 404);
    }
    if (error.message === ADMIN_MESSAGES.RESEND_COOLDOWN) {
      return customResponse(res, error.message, 429, { waitSeconds: error.waitSeconds });
    }
    if (error.message === ADMIN_MESSAGES.SMS_SEND_FAILED) {
      return customResponse(res, error.message, 502);
    }
    logger.error('Resend OTP error:', error);
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;
    const result = await verifyForgotPasswordOtp(mobileNumber, otp);
    return customResponse(res, result.message, 200, { resetToken: result.resetToken });
  } catch (error) {
    if (
      error.message === ADMIN_MESSAGES.OTP_EXPIRED ||
      error.message === ADMIN_MESSAGES.OTP_INVALID ||
      error.message === ADMIN_MESSAGES.MOBILE_NOT_REGISTERED
    ) {
      return customResponse(res, error.message, 400);
    }
    logger.error('Verify OTP error:', error);
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    const result = await resetAdminPassword(resetToken, newPassword);
    return customResponse(res, result.message, 200);
  } catch (error) {
    if (error.message === ADMIN_MESSAGES.RESET_TOKEN_INVALID) {
      return customResponse(res, error.message, 400);
    }
    logger.error('Reset password error:', error);
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};
