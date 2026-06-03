import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { patientPortalAuth } from '../../middleware/patientPortalAuthMiddleware.js';
import {
  patientRegisterSchema,
  patientMobileSchema,
  patientVerifyOtpSchema,
  patientUpdateProfileSchema,
} from '../validators/patientPortal.validator.js';
import {
  patientRegister,
  patientSendOtp,
  patientResendOtp,
  patientVerifyOtp,
  patientMe,
  patientUpdateMe,
  patientMasters,
} from '../controllers/patientPortal.controller.js';

const router = Router();

router.get('/masters', patientMasters);
router.post('/register', validateRequest(patientRegisterSchema), patientRegister);
router.post('/auth/send-otp', validateRequest(patientMobileSchema), patientSendOtp);
router.post('/auth/resend-otp', validateRequest(patientMobileSchema), patientResendOtp);
router.post('/auth/verify-otp', validateRequest(patientVerifyOtpSchema), patientVerifyOtp);
router.get('/me', patientPortalAuth, patientMe);
router.patch('/me', patientPortalAuth, validateRequest(patientUpdateProfileSchema), patientUpdateMe);

export default router;
