import jwt from 'jsonwebtoken';
import User from '../../models/user.model.js';
import HmsStaff from '../../models/hmsStaff.model.js';
import { generateToken } from '../../utils/tokenUtil.js';
import { getPortalPermissions } from '../../utils/rbac.service.js';
import { staffLoginEmailAliases } from '../../utils/staffCredentials.util.js';
import { ErrorMessages, ADMIN_MESSAGES } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';
import { CLIENT } from '../../utils/constants.js';
import { getOtpConfig, isStaticOtpMatch } from '../../config/otp.config.js';
import { sendOtpNotification, isOtpNotificationEnabled } from '../../services/sms/notify.service.js';

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

const formatStaffUser = async (staff) => {
  const permissions = await getPortalPermissions('staff', staff.role);
  return {
    _id: String(staff._id),
    accountType: 'staff',
    role: 'staff',
    staffRole: staff.role,
    staffCode: staff.staffCode,
    name: staff.name,
    email: staff.email,
    title: staff.title,
    permissions,
  };
};

export const loginAdmin = async (email, password) => {
  const normalized = email.toLowerCase().trim();

  const admin = await User.findOne({ email: normalized, role: 'admin' });
  if (admin) {
    const isValid = await admin.comparePassword(password);
    if (!isValid) throw new Error(ErrorMessages.INVALID_CREDENTIALS);
    if (!admin.status) throw new Error(ADMIN_MESSAGES.ACCOUNT_INACTIVE);
    const permissions = await getPortalPermissions('admin');
    const token = generateToken(admin._id, { role: 'admin' });
    return {
      token,
      user: {
        ...sanitizeUser(admin),
        accountType: 'admin',
        role: 'admin',
        permissions,
      },
    };
  }

  const emailAliases = staffLoginEmailAliases(normalized);
  const staff = await HmsStaff.findOne({ email: { $in: emailAliases }, status: true });
  if (!staff) throw new Error(ErrorMessages.INVALID_CREDENTIALS);

  const staffValid = await staff.comparePassword(password);
  if (!staffValid) throw new Error(ErrorMessages.INVALID_CREDENTIALS);

  const token = generateToken(staff._id, { role: 'staff', staffRole: staff.role });
  return { token, user: await formatStaffUser(staff) };
};

export const getAdminProfile = async (userId, jwtRole = 'admin') => {
  if (jwtRole === 'staff') {
    const staff = await HmsStaff.findById(userId).select('-password');
    if (!staff || !staff.status) throw new Error(ErrorMessages.USER_NOT_FOUND);
    return formatStaffUser(staff);
  }

  const user = await User.findById(userId).select('-password -otp -resetToken');
  if (!user || user.role !== 'admin') {
    throw new Error(ErrorMessages.USER_NOT_FOUND);
  }
  const permissions = await getPortalPermissions('admin');
  return {
    ...sanitizeUser(user),
    accountType: 'admin',
    role: 'admin',
    permissions,
  };
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
    await sendOtpNotification(mobileNumber, otp, {
      email: user.email,
      name: user.firstName || 'Admin',
      purpose: 'reset your password',
    });
  } catch (error) {
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();
    throw new Error(ADMIN_MESSAGES.SMS_SEND_FAILED);
  }

  if (!isOtpNotificationEnabled()) {
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
