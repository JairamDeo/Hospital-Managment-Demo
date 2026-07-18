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
import {
  patientGetRazorpayConfig,
  patientGetAppointmentPaymentStatus,
  patientCreateAppointmentRazorpayOrder,
  patientVerifyAppointmentRazorpayPayment,
} from '../controllers/patientPortalAppointmentPayment.controller.js';
import { patientVerifyAppointmentPaymentSchema } from '../validators/patientPortal.validator.js';
import {
  patientListLabReports,
  patientListLabOrders,
  patientListLabMasters,
  patientUploadLabReport,
} from '../controllers/patientPortalLab.controller.js';
import { labReportUpload } from '../../middleware/labReportUpload.middleware.js';

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

router.get('/billing/razorpay/config', patientPortalAuth, patientGetRazorpayConfig);
router.get(
  '/appointments/:appointmentCode/payment',
  patientPortalAuth,
  patientGetAppointmentPaymentStatus
);
router.post(
  '/appointments/:appointmentCode/razorpay/order',
  patientPortalAuth,
  patientCreateAppointmentRazorpayOrder
);
router.post(
  '/appointments/:appointmentCode/razorpay/verify',
  patientPortalAuth,
  validateRequest(patientVerifyAppointmentPaymentSchema),
  patientVerifyAppointmentRazorpayPayment
);

router.get('/lab/reports', patientPortalAuth, patientListLabReports);
router.get('/lab/orders', patientPortalAuth, patientListLabOrders);
router.get('/lab/masters', patientPortalAuth, patientListLabMasters);
router.post(
  '/lab/reports/upload',
  patientPortalAuth,
  (req, res, next) => {
    labReportUpload(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message, status_code: 400, res: null });
      return next();
    });
  },
  patientUploadLabReport
);

export default router;
