import { Router } from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import { userRegistrationSchema, userLoginSchema } from '../validators/user.validator.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { registerUser, loginUserController, getModuleList, postAccessModuleController } from '../controllers/user.controller.js';
import { registerRateLimiter} from '../middleware/rateLimiter.js';

const router = Router();

router.post('/user-register', registerRateLimiter, validateRequest(userRegistrationSchema), registerUser);
router.post('/user-login', validateRequest(userLoginSchema), loginUserController);
// router.post('/user-verify-otp/:id',authenticateToken, validateRequest(otpVerificationSchema), verifyOTP);
// router.post('/user-resend-otp/:id', authenticateToken, resendOTPController);
//get module list
router.get('/module-list',authenticateToken, getModuleList);
router.post('/post-access-module/:id', authenticateToken, postAccessModuleController);

export default router;
