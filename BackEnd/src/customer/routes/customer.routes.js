import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { customerAuth } from '../../middleware/customerAuthMiddleware.js';
import {
  customerRegisterSchema,
  customerMobileSchema,
  customerVerifyOtpSchema,
  customerUpdateProfileSchema,
} from '../validators/customer.validator.js';
import {
  customerRegister,
  customerSendOtp,
  customerResendOtp,
  customerVerifyOtp,
  customerMe,
  customerUpdateMe,
} from '../controllers/customer.controller.js';

const router = Router();

router.post('/register', validateRequest(customerRegisterSchema), customerRegister);
router.post('/auth/send-otp', validateRequest(customerMobileSchema), customerSendOtp);
router.post('/auth/resend-otp', validateRequest(customerMobileSchema), customerResendOtp);
router.post('/auth/verify-otp', validateRequest(customerVerifyOtpSchema), customerVerifyOtp);
router.get('/me', customerAuth, customerMe);
router.patch('/me', customerAuth, validateRequest(customerUpdateProfileSchema), customerUpdateMe);

export default router;
