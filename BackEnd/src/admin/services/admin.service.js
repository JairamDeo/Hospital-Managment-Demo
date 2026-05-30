import jwt from 'jsonwebtoken';
import User from '../../models/user.model.js';
import { generateToken } from '../../utils/tokenUtil.js';
import { ErrorMessages, ADMIN_MESSAGES } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';
import { CLIENT } from '../../utils/constants.js';
import { getOtpConfig, isStaticOtpMatch } from '../../config/otp.config.js';
import { sendOtpSms, isMsg91Enabled } from '../../services/sms/msg91.service.js';

const RESET_TOKEN_VALIDITY_MS = 15 * 60 * 1000;

const generateOtp = () => String(Math.floor(1000 + Math.random() * 9000));

const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.otp;
  delete obj.resetToken;
  return obj;
};

const getOtpMeta = () => {
  const { expirySeconds, resendCooldownSeconds } = getOtpConfig();
  return {
    expiresInSeconds: expirySeconds,
    resendAfterSeconds: resendCooldownSeconds,
  };
};

const issueResetToken = async (user) => {
  const resetToken = jwt.sign(
    { id: user._id, purpose: 'password_reset' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  user.resetToken = resetToken;
  user.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_VALIDITY_MS);
  user.otp = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  return resetToken;
};

export const loginAdmin = async (email, password) => {
  const user = await User.findOne({ email: email.toLowerCase(), role: 'admin' });
  if (!user) {
    throw new Error(ErrorMessages.INVALID_CREDENTIALS);
  }
  const isValid = await user.comparePassword(password);
  if (!isValid) {
    throw new Error(ErrorMessages.INVALID_CREDENTIALS);
  }
  if (!user.status) {
    throw new Error(ADMIN_MESSAGES.ACCOUNT_INACTIVE);
  }
  const token = generateToken(user._id, { role: 'admin' });
  return { token, user: sanitizeUser(user) };
};

export const getAdminProfile = async (userId) => {
  const user = await User.findById(userId).select('-password -otp -resetToken');
  if (!user || user.role !== 'admin') {
    throw new Error(ErrorMessages.USER_NOT_FOUND);
  }
  return user;
};

export const sendForgotPasswordOtp = async (mobileNumber) => {
  const { expiryMs, resendCooldownMs } = getOtpConfig();
  const user = await User.findOne({ mobileNumber, role: 'admin' });
  if (!user) {
    throw new Error(ADMIN_MESSAGES.MOBILE_NOT_REGISTERED);
  }

  if (user.lastOtpSentAt) {
    const elapsed = Date.now() - new Date(user.lastOtpSentAt).getTime();
    if (elapsed < resendCooldownMs) {
      const waitSeconds = Math.ceil((resendCooldownMs - elapsed) / 1000);
      const err = new Error(ADMIN_MESSAGES.RESEND_COOLDOWN);
      err.waitSeconds = waitSeconds;
      throw err;
    }
  }

  const otp = generateOtp();
  user.otp = otp;
  user.otpExpiresAt = new Date(Date.now() + expiryMs);
  user.lastOtpSentAt = new Date();
  user.resetToken = undefined;
  user.resetTokenExpiresAt = undefined;
  await user.save();

  try {
    await sendOtpSms(mobileNumber, otp);
  } catch (error) {
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();
    throw new Error(ADMIN_MESSAGES.SMS_SEND_FAILED);
  }

  if (!isMsg91Enabled()) {
    logger.info(`Admin OTP (dev) for ${mobileNumber}: ${otp}`);
  }

  return {
    message: ADMIN_MESSAGES.OTP_SENT,
    ...getOtpMeta(),
  };
};

export const resendForgotPasswordOtp = async (mobileNumber) => {
  return sendForgotPasswordOtp(mobileNumber);
};

export const verifyForgotPasswordOtp = async (mobileNumber, otp) => {
  const user = await User.findOne({ mobileNumber, role: 'admin' });
  if (!user) {
    throw new Error(ADMIN_MESSAGES.MOBILE_NOT_REGISTERED);
  }

  const otpStr = String(otp).trim();

  if (isStaticOtpMatch(otpStr)) {
    logger.info(`Static OTP used for admin reset: ${mobileNumber}`);
    const resetToken = await issueResetToken(user);
    return {
      message: ADMIN_MESSAGES.OTP_VERIFIED,
      resetToken,
    };
  }

  if (!user.otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    throw new Error(ADMIN_MESSAGES.OTP_EXPIRED);
  }
  if (user.otp !== otpStr) {
    throw new Error(ADMIN_MESSAGES.OTP_INVALID);
  }

  const resetToken = await issueResetToken(user);

  return {
    message: ADMIN_MESSAGES.OTP_VERIFIED,
    resetToken,
  };
};

export const resetAdminPassword = async (resetToken, newPassword) => {
  let decoded;
  try {
    decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
  } catch {
    throw new Error(ADMIN_MESSAGES.RESET_TOKEN_INVALID);
  }

  if (decoded.purpose !== 'password_reset') {
    throw new Error(ADMIN_MESSAGES.RESET_TOKEN_INVALID);
  }

  const user = await User.findById(decoded.id);
  if (!user || user.role !== 'admin' || user.resetToken !== resetToken) {
    throw new Error(ADMIN_MESSAGES.RESET_TOKEN_INVALID);
  }
  if (!user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    throw new Error(ADMIN_MESSAGES.RESET_TOKEN_INVALID);
  }

  user.password = newPassword;
  user.resetToken = undefined;
  user.resetTokenExpiresAt = undefined;
  user.markModified('password');
  await user.save();

  return { message: ADMIN_MESSAGES.PASSWORD_RESET_SUCCESS };
};

export const seedAdminUser = async () => {
  const email = process.env.ADMIN_SEED_EMAIL || 'admin@ayurvedahealth.com';
  const mobileNumber = process.env.ADMIN_SEED_MOBILE || '9876543210';
  const password = process.env.ADMIN_SEED_PASSWORD || 'Admin@123';

  const existing = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { mobileNumber }],
  });

  if (existing) {
    logger.info('Admin user already exists, skipping seed');
    return existing;
  }

  const codePrefix = CLIENT.USER_CODE_PREFIX;
  const lastUser = await User.findOne({ userCode: { $regex: `^${codePrefix}` } }).sort({
    userCode: -1,
  });
  let sequence = 1;
  if (lastUser?.userCode) {
    sequence = parseInt(lastUser.userCode.slice(-3), 10) + 1;
  }

  const admin = new User({
    userCode: `${codePrefix}${sequence.toString().padStart(3, '0')}`,
    firstName: 'Admin',
    lastName: '1',
    name: 'Admin 1',
    mobileNumber,
    email: email.toLowerCase(),
    password,
    role: 'admin',
    status: true,
  });

  await admin.save();
  logger.info(`Admin seeded: ${email}`);
  return admin;
};
