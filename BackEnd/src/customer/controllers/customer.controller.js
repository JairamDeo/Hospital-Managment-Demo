import { customResponse } from '../../utils/response.js';
import { logger } from '../../utils/logger.js';
import { ErrorMessages, CUSTOMER_MESSAGES } from '../../utils/constants.js';
import {
  registerCustomer,
  sendCustomerLoginOtp,
  resendCustomerLoginOtp,
  verifyCustomerOtp,
  getCustomerProfile,
  updateCustomerProfile,
} from '../services/customer.service.js';

export const customerRegister = async (req, res) => {
  try {
    const result = await registerCustomer(req.body);
    return customResponse(res, result.message, 201, {
      mobileNumber: result.mobileNumber,
      expiresInSeconds: result.expiresInSeconds,
      resendAfterSeconds: result.resendAfterSeconds,
    });
  } catch (error) {
    if (
      error.message === CUSTOMER_MESSAGES.MOBILE_ALREADY_REGISTERED ||
      error.message === CUSTOMER_MESSAGES.EMAIL_ALREADY_REGISTERED
    ) {
      return customResponse(res, error.message, 409);
    }
    if (error.message === CUSTOMER_MESSAGES.RESEND_COOLDOWN) {
      return customResponse(res, error.message, 429, { waitSeconds: error.waitSeconds });
    }
    if (error.message === CUSTOMER_MESSAGES.SMS_SEND_FAILED) {
      return customResponse(res, error.message, 502);
    }
    logger.error('Customer register error:', error);
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const customerSendOtp = async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    const result = await sendCustomerLoginOtp(mobileNumber);
    return customResponse(res, result.message, 200, {
      expiresInSeconds: result.expiresInSeconds,
      resendAfterSeconds: result.resendAfterSeconds,
    });
  } catch (error) {
    if (error.message === CUSTOMER_MESSAGES.MOBILE_NOT_REGISTERED) {
      return customResponse(res, error.message, 404);
    }
    if (error.message === CUSTOMER_MESSAGES.ACCOUNT_INACTIVE) {
      return customResponse(res, error.message, 403);
    }
    if (error.message === CUSTOMER_MESSAGES.RESEND_COOLDOWN) {
      return customResponse(res, error.message, 429, { waitSeconds: error.waitSeconds });
    }
    if (error.message === CUSTOMER_MESSAGES.SMS_SEND_FAILED) {
      return customResponse(res, error.message, 502);
    }
    logger.error('Customer send OTP error:', error);
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const customerResendOtp = async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    const result = await resendCustomerLoginOtp(mobileNumber);
    return customResponse(res, CUSTOMER_MESSAGES.OTP_RESENT, 200, {
      expiresInSeconds: result.expiresInSeconds,
      resendAfterSeconds: result.resendAfterSeconds,
    });
  } catch (error) {
    if (error.message === CUSTOMER_MESSAGES.MOBILE_NOT_REGISTERED) {
      return customResponse(res, error.message, 404);
    }
    if (error.message === CUSTOMER_MESSAGES.RESEND_COOLDOWN) {
      return customResponse(res, error.message, 429, { waitSeconds: error.waitSeconds });
    }
    if (error.message === CUSTOMER_MESSAGES.SMS_SEND_FAILED) {
      return customResponse(res, error.message, 502);
    }
    logger.error('Customer resend OTP error:', error);
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const customerVerifyOtp = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;
    const result = await verifyCustomerOtp(mobileNumber, otp);
    logger.info(`Customer logged in: ${mobileNumber}`);
    return customResponse(res, result.message, 200, {
      token: result.token,
      customer: result.customer,
    });
  } catch (error) {
    if (
      error.message === CUSTOMER_MESSAGES.OTP_INVALID ||
      error.message === CUSTOMER_MESSAGES.OTP_EXPIRED
    ) {
      return customResponse(res, error.message, 400);
    }
    if (error.message === CUSTOMER_MESSAGES.MOBILE_NOT_REGISTERED) {
      return customResponse(res, error.message, 404);
    }
    logger.error('Customer verify OTP error:', error);
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const customerMe = async (req, res) => {
  try {
    const customer = await getCustomerProfile(req.user.id);
    return customResponse(res, CUSTOMER_MESSAGES.PROFILE_FETCHED, 200, { customer });
  } catch (error) {
    if (error.message === ErrorMessages.USER_NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    logger.error('Customer profile error:', error);
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const customerUpdateMe = async (req, res) => {
  try {
    const customer = await updateCustomerProfile(req.user.id, req.body);
    return customResponse(res, CUSTOMER_MESSAGES.PROFILE_UPDATED, 200, { customer });
  } catch (error) {
    if (error.message === ErrorMessages.USER_NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    if (error.message === CUSTOMER_MESSAGES.EMAIL_ALREADY_REGISTERED) {
      return customResponse(res, error.message, 409);
    }
    logger.error('Customer update profile error:', error);
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};
