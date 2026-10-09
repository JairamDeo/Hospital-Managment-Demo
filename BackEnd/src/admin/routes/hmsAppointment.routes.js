import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { portalAuth } from '../../middleware/portalAuthMiddleware.js';
import {
  createAppointmentSchema,
  availabilityQuerySchema,
  attendAppointmentSchema,
  cancelAppointmentSchema,
  rescheduleAppointmentSchema,
} from '../validators/hmsAppointment.validator.js';
import {
  getAppointments,
  getAppointmentsStats,
  getStaffAppointments,
  getAppointmentAvailability,
  postAppointment,
  getDoctorsForBooking,
  getAppointment,
  patchAttendAppointment,
  patchCancelAppointment,
  patchRescheduleAppointment,
} from '../controllers/hmsAppointment.controller.js';

const router = Router();

router.use(portalAuth);

router.get('/', getAppointments);
router.get('/stats/summary', getAppointmentsStats);
router.get('/doctors', getDoctorsForBooking);
router.get('/availability', validateRequest(availabilityQuerySchema, 'query'), getAppointmentAvailability);
router.post('/', validateRequest(createAppointmentSchema), postAppointment);
router.get('/staff/:staffCode', getStaffAppointments);
router.patch(
  '/:appointmentCode/attend',
  validateRequest(attendAppointmentSchema),
  patchAttendAppointment
);
router.patch(
  '/:appointmentCode/cancel',
  validateRequest(cancelAppointmentSchema),
  patchCancelAppointment
);
router.patch(
  '/:appointmentCode/reschedule',
  validateRequest(rescheduleAppointmentSchema),
  patchRescheduleAppointment
);
router.get('/:appointmentCode', getAppointment);

export default router;
