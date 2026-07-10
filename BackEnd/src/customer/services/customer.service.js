import Customer from '../../models/customer.model.js';
import { generateToken } from '../../utils/tokenUtil.js';
import { ErrorMessages, CUSTOMER_MESSAGES } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';
import { getOtpConfig, isStaticOtpMatch } from '../../config/otp.config.js';
import { sendOtpNotification, isOtpNotificationEnabled } from '../../services/sms/notify.service.js';

const generateOtp = () => String(Math.floor(1000 + Math.random() * 9000));

const getOtpMeta = () => {
  const { expirySeconds, resendCooldownSeconds } = getOtpConfig();
  return {
    expiresInSeconds: expirySeconds,
    resendAfterSeconds: resendCooldownSeconds,
  };
};

const sanitizeCustomer = (customer) => {
  const obj = customer.toObject ? customer.toObject() : { ...customer };
  delete obj.otp;
  delete obj.otpExpiresAt;
  delete obj.lastOtpSentAt;
  return obj;
};

const generateCustomerCode = async () => {
  const count = await Customer.countDocuments();
  return `CU-${String(10001 + count).padStart(5, '0')}`;
};

const assignAndSendOtp = async (customer) => {
  const { expiryMs, resendCooldownMs } = getOtpConfig();

  if (customer.lastOtpSentAt) {
    const elapsed = Date.now() - new Date(customer.lastOtpSentAt).getTime();
    if (elapsed < resendCooldownMs) {
      const waitSeconds = Math.ceil((resendCooldownMs - elapsed) / 1000);
      const err = new Error(CUSTOMER_MESSAGES.RESEND_COOLDOWN);
      err.waitSeconds = waitSeconds;
      throw err;
    }
  }

  const otp = generateOtp();
  customer.otp = otp;
  customer.otpExpiresAt = new Date(Date.now() + expiryMs);
  customer.lastOtpSentAt = new Date();
  await customer.save();

  try {
    await sendOtpNotification(customer.mobileNumber, otp, {
      email: customer.email,
      name: customer.name,
      purpose: 'verify your account',
    });
  } catch {
    customer.otp = undefined;
    customer.otpExpiresAt = undefined;
    await customer.save();
    throw new Error(CUSTOMER_MESSAGES.SMS_SEND_FAILED);
  }

  if (!isOtpNotificationEnabled()) {
    logger.info(`Customer OTP (dev) for ${customer.mobileNumber}: ${otp}`);
  }

  return {
    message: CUSTOMER_MESSAGES.OTP_SENT,
    ...getOtpMeta(),
  };
};

export const registerCustomer = async (payload) => {
  const mobile = payload.mobileNumber.trim();
  const email = payload.email.trim().toLowerCase();

  const existingMobile = await Customer.findOne({ mobileNumber: mobile });
  if (existingMobile) {
    throw new Error(CUSTOMER_MESSAGES.MOBILE_ALREADY_REGISTERED);
  }

  const existingEmail = await Customer.findOne({ email });
  if (existingEmail) {
    throw new Error(CUSTOMER_MESSAGES.EMAIL_ALREADY_REGISTERED);
  }

  const customer = await Customer.create({
    customerCode: await generateCustomerCode(),
    name: payload.name.trim(),
    email,
    mobileNumber: mobile,
    age: payload.age,
    gender: payload.gender,
  });

  const otpResult = await assignAndSendOtp(customer);
  return { ...otpResult, mobileNumber: mobile };
};

export const sendCustomerLoginOtp = async (mobileNumber) => {
  const customer = await Customer.findOne({ mobileNumber });
  if (!customer) {
    throw new Error(CUSTOMER_MESSAGES.MOBILE_NOT_REGISTERED);
  }
  if (!customer.status) {
    throw new Error(CUSTOMER_MESSAGES.ACCOUNT_INACTIVE);
  }
  return assignAndSendOtp(customer);
};

export const resendCustomerLoginOtp = async (mobileNumber) => {
  return sendCustomerLoginOtp(mobileNumber);
};

export const verifyCustomerOtp = async (mobileNumber, otp) => {
  const customer = await Customer.findOne({ mobileNumber });
  if (!customer) {
    throw new Error(CUSTOMER_MESSAGES.MOBILE_NOT_REGISTERED);
  }

  if (!customer.otp || !customer.otpExpiresAt) {
    throw new Error(CUSTOMER_MESSAGES.OTP_EXPIRED);
  }

  if (new Date() > customer.otpExpiresAt) {
    customer.otp = undefined;
    customer.otpExpiresAt = undefined;
    await customer.save();
    throw new Error(CUSTOMER_MESSAGES.OTP_EXPIRED);
  }

  const valid = customer.otp === otp || isStaticOtpMatch(otp);
  if (!valid) {
    throw new Error(CUSTOMER_MESSAGES.OTP_INVALID);
  }

  customer.otp = undefined;
  customer.otpExpiresAt = undefined;
  await customer.save();

  const token = generateToken(customer._id, { role: 'customer' });
  return {
    message: CUSTOMER_MESSAGES.LOGIN_SUCCESS,
    token,
    customer: sanitizeCustomer(customer),
  };
};

export const getCustomerProfile = async (customerId) => {
  const customer = await Customer.findById(customerId).select('-otp -otpExpiresAt -lastOtpSentAt');
  if (!customer) {
    throw new Error(ErrorMessages.USER_NOT_FOUND);
  }
  return sanitizeCustomer(customer);
};

export const updateCustomerProfile = async (customerId, payload) => {
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new Error(ErrorMessages.USER_NOT_FOUND);
  }

  if (payload.name !== undefined) {
    customer.name = payload.name.trim();
  }

  if (payload.email !== undefined) {
    const email = payload.email.trim().toLowerCase();
    const existingEmail = await Customer.findOne({ email, _id: { $ne: customerId } });
    if (existingEmail) {
      throw new Error(CUSTOMER_MESSAGES.EMAIL_ALREADY_REGISTERED);
    }
    customer.email = email;
  }

  if (payload.age !== undefined) {
    customer.age = payload.age;
  }

  if (payload.gender !== undefined) {
    customer.gender = payload.gender;
  }

  if (payload.prakriti !== undefined) {
    customer.prakriti = payload.prakriti || null;
  }

  await customer.save();
  return sanitizeCustomer(customer);
};
