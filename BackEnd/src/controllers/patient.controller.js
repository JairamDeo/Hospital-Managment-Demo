import { generateToken } from '../utils/tokenUtil.js';
import { customResponse } from '../utils/response.js';
import logger from '../utils/logger.js';
import { PATIENT_MESSAGES,ErrorMessages } from '../utils/constants.js';
import { verifyCaptcha } from '../services/captcha.service.js';
import { createPatient, findPatientByMobile, insertGeneralInfo , verifyCode, resendOTP, doctorList,loginPatient, dashboardData } from '../services/patient.service.js';
import { createContact } from '../services/contactUs.service.js';



// Controller to register a new patient
export const registerPatient = async (req, res) => {
    try {
      // 1. Validate the request body first (Joi validator already applied before this on route call)
      debugger
      if (process.env.NODE_ENV === 'production') {
        // Do real reCAPTCHA validation
        // 2. Check if recaptcha token is present
      if (!req.body.recaptchaToken) {
        logger.error('Recaptcha token missing in request body');
        return customResponse(res, ErrorMessages.GOOGLE_RECAPTCHA_ERROR, 500);
      }
  
      // 3. Verify Google reCAPTCHA
      const isVerified = await verifyCaptcha(req.body.recaptchaToken);
      if (!isVerified) {
        logger.error('Google reCAPTCHA verification failed');
        return customResponse(res, ErrorMessages.GOOGLE_RECAPTCHA_INVALID, 500);
      }
      }
      
      const patientData = req.body;
  
      // 4. Check if mobile number already exists
      const existingPatient = await findPatientByMobile(patientData.mobileNumber);
      if (existingPatient) {
        logger.warn(`Hey, this mobile number is already registered: ${patientData.mobileNumber}`);
        return customResponse(res, PATIENT_MESSAGES.MOBILE_ALREADY_REGISTERED, 400);
      }
      
      // 5. Save new patient
      const patient = await createPatient(patientData);
      logger.info(`New patient registered with ID: ${patient._id}`);
  
      // 6. Generate JWT token
      const token = generateToken(patient._id);
  
    
      // 7. Send Verification OTP via Mobile Number
      const otp = Math.floor(1000 + Math.random() * 9000);
      patient.otp = otp;
      patient.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
      await patient.save();
      logger.info(`Verification OTP sent to ${patient.mobileNumber}`);
      
      // 8. Send success response
      return customResponse(res, PATIENT_MESSAGES.REGISTER_SUCCESS, 201, { token, patient });
  
    } catch (error) {

      logger.error('Error registering patient:', error);
      return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
    }
  };
// controller to verify OTP
export const verifyOTP = async (req, res) => {
    try {
    
      const patientId = req.params.id;
      // validate patientId in userId format
      if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
        logger.warn(`Invalid patient ID format: ${patientId}`);
        return customResponse(res, ErrorMessages.PATIENT_NOT_FOUND, 404);
      }
      const otp = req.body.otp;
      const isVerified = await verifyCode(patientId, otp);
      if (isVerified) {
        logger.info(`OTP verified for patient with ID: ${patientId}`);
        return customResponse(res, PATIENT_MESSAGES.OTP_VERIFIED, 200);
      } else {
        logger.warn(`OTP verification failed for patient with ID: ${patientId}`);
        return customResponse(res, PATIENT_MESSAGES.OTP_VERIFICATION_FAILED, 400);
      }
    } catch (error) {
      if (err.message === 'Patient not found') {
        logger.warn(`Patient not found with ID: ${req.params.id}`);
        return customResponse(res, ErrorMessages.PATIENT_NOT_FOUND, 404);
      }
      logger.error('Error verifying OTP:', error);
      return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
    }
  
}  
//controller to resend OTP on mobile number and email
export const resendOTPController = async (req, res) => {
    try {
      const patientId = req.params.id;
      // validate patientId in userId format
      if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
        logger.warn(`Invalid patient ID format: ${patientId}`);
        return customResponse(res, ErrorMessages.PATIENT_NOT_FOUND, 404);
      }
      await resendOTP(patientId);
      logger.info(`OTP resent for patient with ID: ${patientId}`);
      return customResponse(res, PATIENT_MESSAGES.OTP_RESENT, 200);
    } catch (error) {
      if (err.message === 'Patient not found') {
        logger.warn(`Patient not found with ID: ${req.params.id}`);
        return customResponse(res, ErrorMessages.PATIENT_NOT_FOUND, 404);
      }
      logger.error('Error resending OTP:', error);
      return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
} 
};
// Controller to add general information fields of a patient
export const addGeneralInfo = async (req, res) => {
    try {
      const patientId = req.params.id;
      const generalInfo = req.body;
      // validate patientId in userId format
      if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
        logger.warn(`Invalid patient ID format: ${patientId}`);
        return customResponse(res, ErrorMessages.PATIENT_NOT_FOUND, 404);
      }

      const updatedPatient = await insertGeneralInfo(patientId, generalInfo);
      logger.info(`General information added for patient with ID: ${patientId}`);
    
      return customResponse(res, PATIENT_MESSAGES.GENERAL_INFO_ADDED, 200, updatedPatient);
    } catch (error) {
      if (error.message === 'Patient not found') {
        logger.warn(`Patient not found with ID: ${req.params.id}`);
        return customResponse(res, ErrorMessages.PATIENT_NOT_FOUND, 404);
      }
      logger.error('Error adding general information:', error);
      return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
    }
}  
//controller to patient login
export const loginPatientController = async (req, res) => {
    try {
      const mobileNumber = req.body.mobileNumber;
      const password = req.body.password;
      const patient = await loginPatient(mobileNumber, password);
      logger.info(`Patient logged in with ID: ${patient._id}`);
      const token = generateToken(patient._id);
      return customResponse(res, PATIENT_MESSAGES.LOGIN_SUCCESS, 200, { token, patient });
    } catch (error) {
      if (error.message === 'Patient not found') {
        logger.warn(`Patient not found with ID: ${req.params.id}`);
        return customResponse(res, ErrorMessages.PATIENT_NOT_FOUND, 404);
      }
      if (error.message === 'Invalid password') {
        logger.warn(`Invalid password for patient with mobile number: ${req.body.mobileNumber}`);
        return customResponse(res, PATIENT_MESSAGES.INVALID_PASSWORD, 401);
      }
      logger.error('Error logging in patient:', error);
      return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
    }
};
// controller to get doctor list
export const getDoctorList = async (req, res) => {
    try {
      const doctors = await doctorList();
      return customResponse(res, PATIENT_MESSAGES.DOCTOR_LIST, 200, doctors);
    } catch (error) {
      logger.error('Error getting doctor list:', error);
      return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
    }
  };

export const getDashboardData = async (req, res) => {
    try {
      // Assuming you have a service to get dashboard data
      const dashboardData = await dashboardData(req.user._id);
      return customResponse(res, PATIENT_MESSAGES.DASHBOARD_DATA, 200, dashboardData);
    } catch (error) {
      logger.error('Error getting dashboard data:', error);
      return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
    }
  }  

// Controller to handle contact us requests
export const contactUsController = async (req, res) => {
    try {
      // Handle contact us logic here
      // For example, you can save the contact message to the database or send an email to a support team
      logger.info('Contact us request received:', req.body);
      // Assuming you have a service to handle contact us logic
      await createContact(req.body);  
      return customResponse(res, PATIENT_MESSAGES.CONTACT_SUCCESS, 200);
    } catch (error) {
      logger.error('Error handling contact us request:', error);
      return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
    }
  };