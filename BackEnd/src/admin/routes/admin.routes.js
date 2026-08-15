import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { portalAuth } from '../../middleware/portalAuthMiddleware.js';
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
import {
  getMyNotifications,
  postMarkNotificationRead,
  postMarkAllNotificationsRead,
} from '../controllers/hmsLab.controller.js';

const router = Router();

router.post('/login', validateRequest(adminLoginSchema), adminLogin);
router.post('/forgot-password/send-otp', validateRequest(forgotPasswordMobileSchema), sendOtp);
router.post('/forgot-password/resend-otp', validateRequest(forgotPasswordMobileSchema), resendOtp);
router.post('/forgot-password/verify-otp', validateRequest(verifyOtpSchema), verifyOtp);
router.post('/forgot-password/reset-password', validateRequest(resetPasswordSchema), resetPassword);

router.get('/me', portalAuth, adminMe);

router.get('/notifications', portalAuth, getMyNotifications);
router.post('/notifications/read-all', portalAuth, postMarkAllNotificationsRead);
router.post('/notifications/:id/read', portalAuth, postMarkNotificationRead);

export default router;
