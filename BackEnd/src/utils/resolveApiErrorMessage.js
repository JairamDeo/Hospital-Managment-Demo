import { ErrorMessages, PATIENT_MESSAGES } from './constants.js';

const TECHNICAL_PATTERNS = [
  /is not a function/i,
  /Cannot read propert/i,
  /Unexpected token/i,
  /EADDRINUSE/i,
  /ECONNREFUSED/i,
];

const isTechnicalMessage = (message) =>
  TECHNICAL_PATTERNS.some((pattern) => pattern.test(message));

export const resolveApiErrorMessage = (
  error,
  fallback = ErrorMessages.SERVER_ERROR
) => {
  if (!error) return fallback;

  if (error.name === 'ValidationError' && error.errors) {
    const messages = Object.values(error.errors).map((e) => e.message);
    if (messages.length) return messages.join(' ');
  }

  if (error.code === 11000 && error.keyPattern) {
    if (error.keyPattern.mobileNumber) return PATIENT_MESSAGES.MOBILE_ALREADY_REGISTERED;
    if (error.keyPattern.email) return PATIENT_MESSAGES.EMAIL_ALREADY_REGISTERED;
    if (error.keyPattern.patientCode) return 'Patient ID already exists. Please try again.';
  }

  const message = typeof error.message === 'string' ? error.message.trim() : '';
  if (message && !isTechnicalMessage(message)) return message;

  return fallback;
};
