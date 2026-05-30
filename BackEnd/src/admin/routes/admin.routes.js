import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { adminAuth } from '../../middleware/adminAuthMiddleware.js';
import {
  adminLoginSchema,
  forgotPasswordMobileSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from '../validators/admin.validator.js';
import {
  adminLogin,
  adminMe,
  sendOtp,
  resendOtp,
  verifyOtp,
  resetPassword,
} from '../controllers/admin.controller.js';

const router = Router();

router.post('/login', validateRequest(adminLoginSchema), adminLogin);
router.post('/forgot-password/send-otp', validateRequest(forgotPasswordMobileSchema), sendOtp);
router.post('/forgot-password/resend-otp', validateRequest(forgotPasswordMobileSchema), resendOtp);
router.post('/forgot-password/verify-otp', validateRequest(verifyOtpSchema), verifyOtp);
router.post('/forgot-password/reset-password', validateRequest(resetPasswordSchema), resetPassword);

router.get('/me', adminAuth, adminMe);

export default router;
