import { Router } from 'express';
import { registerPatient,verifyOTP,resendOTPController,loginPatientController,addGeneralInfo, getDoctorList,getDashboardData,contactUsController } from '../controllers/patient.controller.js';
import authenticateToken from '../middleware/authMiddleware.js';
import { patientRegistrationSchema, patientUpdateSchema,patientLoginSchema, otpVerificationSchema, contactUsSchema} from '../validators/patient.validator.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { registerRateLimiter,contactRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/patient-register',registerRateLimiter, validateRequest(patientRegistrationSchema), registerPatient);
router.post('/patient-login', validateRequest(patientLoginSchema), loginPatientController);
router.post('/verify-otp/:id',authenticateToken, validateRequest(otpVerificationSchema), verifyOTP);
router.get('/resend-otp/:id', authenticateToken, resendOTPController);
router.put('/patient-update/:id',authenticateToken, validateRequest(patientUpdateSchema), addGeneralInfo);
router.get('/doctor-list', authenticateToken, getDoctorList);
router.get('/patient-dashboard',authenticateToken, getDashboardData); 
router.get('/contact-us',contactRateLimiter,validateRequest(contactUsSchema),contactUsController)



export default router;
