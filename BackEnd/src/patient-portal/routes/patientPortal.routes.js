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
import {
  patientCreateAppointmentSchema,
  availabilityQuerySchema,
} from '../../admin/validators/hmsAppointment.validator.js';
import {
  patientListAppointments,
  patientGetAvailability,
  patientListDoctors,
  patientBookAppointment,
} from '../controllers/patientPortalAppointment.controller.js';

const router = Router();

router.get('/masters', patientMasters);
router.post('/register', validateRequest(patientRegisterSchema), patientRegister);
router.post('/auth/send-otp', validateRequest(patientMobileSchema), patientSendOtp);
router.post('/auth/resend-otp', validateRequest(patientMobileSchema), patientResendOtp);
router.post('/auth/verify-otp', validateRequest(patientVerifyOtpSchema), patientVerifyOtp);
router.get('/me', patientPortalAuth, patientMe);
router.patch('/me', patientPortalAuth, validateRequest(patientUpdateProfileSchema), patientUpdateMe);
router.get('/appointments', patientPortalAuth, patientListAppointments);
router.get('/appointments/doctors', patientPortalAuth, patientListDoctors);
router.get(
  '/appointments/availability',
  patientPortalAuth,
  validateRequest(availabilityQuerySchema, 'query'),
  patientGetAvailability
);
router.post(
  '/appointments',
  patientPortalAuth,
  validateRequest(patientCreateAppointmentSchema),
  patientBookAppointment
);

export default router;
