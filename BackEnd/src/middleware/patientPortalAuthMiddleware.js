import authenticateToken from './authMiddleware.js';
import HmsPatient from '../models/hmsPatient.model.js';
import { customResponse } from '../utils/response.js';
import { ErrorMessages } from '../utils/constants.js';

export const requirePatientPortal = async (req, res, next) => {
  try {
    if (req.user?.role !== 'patient') {
      return customResponse(res, ErrorMessages.ACCESS_DENIED, 403);
    }
    const patient = await HmsPatient.findById(req.user.id).select('-otp -otpExpiresAt -lastOtpSentAt');
    if (!patient || !patient.status) {
      return customResponse(res, ErrorMessages.ACCESS_DENIED, 403);
    }
    req.patient = patient;
    next();
  } catch {
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const patientPortalAuth = [authenticateToken, requirePatientPortal];

export default patientPortalAuth;
