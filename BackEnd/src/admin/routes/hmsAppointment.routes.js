import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { portalAuth } from '../../middleware/portalAuthMiddleware.js';
import {
  createAppointmentSchema,
  availabilityQuerySchema,
} from '../validators/hmsAppointment.validator.js';
import {
  getAppointments,
  getAppointmentsStats,
  getStaffAppointments,
  getAppointmentAvailability,
  postAppointment,
  getDoctorsForBooking,
} from '../controllers/hmsAppointment.controller.js';

const router = Router();

router.use(portalAuth);

router.get('/', getAppointments);
router.get('/stats/summary', getAppointmentsStats);
router.get('/doctors', getDoctorsForBooking);
router.get('/availability', validateRequest(availabilityQuerySchema, 'query'), getAppointmentAvailability);
router.post('/', validateRequest(createAppointmentSchema), postAppointment);
router.get('/staff/:staffCode', getStaffAppointments);

export default router;
