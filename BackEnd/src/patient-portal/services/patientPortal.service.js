import HmsPatient from '../../models/hmsPatient.model.js';
import { generateToken } from '../../utils/tokenUtil.js';
import { ErrorMessages, PATIENT_PORTAL_MESSAGES } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';
import { getOtpConfig, isStaticOtpMatch } from '../../config/otp.config.js';
import { sendOtpNotification, isOtpNotificationEnabled } from '../../services/sms/notify.service.js';
import { formatHmsPatient } from '../../utils/formatHmsPatient.js';
import { generateHmsPatientCode } from '../../utils/generateHmsPatientCode.js';
import { findHmsPatientById } from '../../utils/hmsPatientQuery.js';
import {
  assertUniquePatientContact,
  normalizeMobileNumber,
} from '../../utils/patientContact.util.js';

const generateOtp = () => String(Math.floor(1000 + Math.random() * 9000));

const getOtpMeta = () => {
  const { expirySeconds, resendCooldownSeconds } = getOtpConfig();
  return { expiresInSeconds: expirySeconds, resendAfterSeconds: resendCooldownSeconds };
};

const assignAndSendOtp = async (patient) => {
  const { expiryMs, resendCooldownMs } = getOtpConfig();

  if (patient.lastOtpSentAt) {
    const elapsed = Date.now() - new Date(patient.lastOtpSentAt).getTime();
    if (elapsed < resendCooldownMs) {
      const waitSeconds = Math.ceil((resendCooldownMs - elapsed) / 1000);
      const err = new Error(PATIENT_PORTAL_MESSAGES.RESEND_COOLDOWN);
      err.waitSeconds = waitSeconds;
      throw err;
    }
  }

  const otp = generateOtp();
  patient.otp = otp;
  patient.otpExpiresAt = new Date(Date.now() + expiryMs);
  patient.lastOtpSentAt = new Date();
  await patient.save();

  try {
    await sendOtpNotification(patient.mobileNumber, otp, {
      email: patient.email,
      name: patient.name,
      purpose: 'verify your account',
    });
  } catch {
    patient.otp = undefined;
    patient.otpExpiresAt = undefined;
    await patient.save();
    throw new Error(PATIENT_PORTAL_MESSAGES.SMS_SEND_FAILED);
  }

  if (!isOtpNotificationEnabled()) {
    logger.info(`Patient OTP (dev) for ${patient.mobileNumber}: ${otp}`);
  }

  return { message: PATIENT_PORTAL_MESSAGES.OTP_SENT, ...getOtpMeta() };
};

export const registerPatientSelf = async (payload) => {
  const { mobileNumber, email } = await assertUniquePatientContact({
    mobileNumber: payload.mobileNumber,
    email: payload.email,
  });

  const patient = await HmsPatient.create({
    patientCode: await generateHmsPatientCode(),
    name: payload.name.trim(),
    email,
    mobileNumber,
    age: payload.age,
    gender: payload.gender,
    prakriti: payload.prakritiId || null,
    treatment: payload.treatmentId || null,
    createdByAdmin: false,
    recordStatus: 'Active',
    status: true,
  });

  const otpResult = await assignAndSendOtp(patient);
  return { ...otpResult, mobileNumber };
};

export const sendPatientLoginOtp = async (mobileNumber) => {
  const mobile = normalizeMobileNumber(mobileNumber);
  const patient = await HmsPatient.findOne({ mobileNumber: mobile });
  if (!patient) {
    throw new Error(PATIENT_PORTAL_MESSAGES.MOBILE_NOT_REGISTERED);
  }
  if (!patient.status) {
    throw new Error(PATIENT_PORTAL_MESSAGES.ACCOUNT_INACTIVE);
  }
  return assignAndSendOtp(patient);
};

export const resendPatientLoginOtp = async (mobileNumber) => sendPatientLoginOtp(mobileNumber);

export const verifyPatientOtp = async (mobileNumber, otp) => {
  const mobile = normalizeMobileNumber(mobileNumber);
  const patient = await HmsPatient.findOne({ mobileNumber: mobile });
  if (!patient) {
    throw new Error(PATIENT_PORTAL_MESSAGES.MOBILE_NOT_REGISTERED);
  }

  if (!patient.otp || !patient.otpExpiresAt) {
    throw new Error(PATIENT_PORTAL_MESSAGES.OTP_EXPIRED);
  }

  if (new Date() > patient.otpExpiresAt) {
    patient.otp = undefined;
    patient.otpExpiresAt = undefined;
    await patient.save();
    throw new Error(PATIENT_PORTAL_MESSAGES.OTP_EXPIRED);
  }

  const valid = patient.otp === otp || isStaticOtpMatch(otp);
  if (!valid) {
    throw new Error(PATIENT_PORTAL_MESSAGES.OTP_INVALID);
  }

  patient.otp = undefined;
  patient.otpExpiresAt = undefined;
  await patient.save();

  const populated = await findHmsPatientById(patient._id);
  const token = generateToken(patient._id, { role: 'patient' });
  return {
    message: PATIENT_PORTAL_MESSAGES.LOGIN_SUCCESS,
    token,
    patient: formatHmsPatient(populated),
  };
};

export const getPatientProfile = async (patientId) => {
  const patient = await findHmsPatientById(patientId).select(
    '-otp -otpExpiresAt -lastOtpSentAt -clinicalProfile'
  );
  if (!patient) {
    throw new Error(ErrorMessages.USER_NOT_FOUND);
  }
  return formatHmsPatient(patient);
};

export const updatePatientProfile = async (patientId, payload) => {
  const patient = await HmsPatient.findById(patientId);
  if (!patient) {
    throw new Error(ErrorMessages.USER_NOT_FOUND);
  }

  if (payload.name !== undefined) patient.name = payload.name.trim();

  if (payload.email !== undefined) {
    const { email } = await assertUniquePatientContact({
      mobileNumber: patient.mobileNumber,
      email: payload.email,
      excludePatientId: patientId,
    });
    patient.email = email;
  }

  if (payload.age !== undefined) patient.age = payload.age;
  if (payload.gender !== undefined) patient.gender = payload.gender;
  if (payload.prakritiId !== undefined) patient.prakriti = payload.prakritiId || null;
  if (payload.treatmentId !== undefined) patient.treatment = payload.treatmentId || null;

  await patient.save();
  const populated = await findHmsPatientById(patient._id);
  return formatHmsPatient(populated);
};
