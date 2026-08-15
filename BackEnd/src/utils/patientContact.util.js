import HmsPatient from '../models/hmsPatient.model.js';
import { PATIENT_MESSAGES } from './constants.js';

/** Normalize to 10-digit Indian mobile (no country code). */
export const normalizeMobileNumber = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits.slice(0, 10);
};

export const isValidMobileNumber = (mobile) => /^[0-9]{10}$/.test(mobile);

/**
 * Ensures mobile is present, valid, and not used by another patient.
 * Email, when provided, must not be used by another patient.
 */
export const assertUniquePatientContact = async ({
  mobileNumber,
  email,
  excludePatientId = null,
}) => {
  const mobile = normalizeMobileNumber(mobileNumber);

  if (!isValidMobileNumber(mobile)) {
    throw new Error('Mobile number must be exactly 10 digits');
  }

  const mobileQuery = { mobileNumber: mobile };
  if (excludePatientId) mobileQuery._id = { $ne: excludePatientId };

  const existingMobile = await HmsPatient.findOne(mobileQuery).select('_id');
  if (existingMobile) {
    throw new Error(PATIENT_MESSAGES.MOBILE_ALREADY_REGISTERED);
  }

  const emailNorm = email?.trim()?.toLowerCase() || undefined;
  if (emailNorm) {
    const emailQuery = { email: emailNorm };
    if (excludePatientId) emailQuery._id = { $ne: excludePatientId };

    const existingEmail = await HmsPatient.findOne(emailQuery).select('_id');
    if (existingEmail) {
      throw new Error(PATIENT_MESSAGES.EMAIL_ALREADY_REGISTERED);
    }
  }

  return { mobileNumber: mobile, email: emailNorm };
};

export const isMongoDuplicateKeyError = (error) => error?.code === 11000;
