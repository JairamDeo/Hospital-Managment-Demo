import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { portalAuth } from '../../middleware/portalAuthMiddleware.js';
import {
  attendPanchakarmaProgramSchema,
  createPanchakarmaProgramSchema,
} from '../validators/hmsPanchakarma.validator.js';
import {
  getPrograms,
  getProgramsStats,
  getStaffPrograms,
  getPatientPrograms,
  getTherapists,
  getRooms,
  postProgram,
  postAttendProgram,
  postTreatmentPlanFromAppointment,
  getProgram,
} from '../controllers/hmsPanchakarma.controller.js';

const router = Router();

router.use(portalAuth);

router.get('/programs', getPrograms);
router.get('/programs/stats/summary', getProgramsStats);
router.get('/programs/therapists', getTherapists);
router.get('/programs/rooms', getRooms);
router.get('/programs/staff/:staffCode', getStaffPrograms);
router.get('/programs/patient/:patientCode', getPatientPrograms);
router.post('/programs', validateRequest(createPanchakarmaProgramSchema), postProgram);
router.post(
  '/programs/:programCode/attend',
  validateRequest(attendPanchakarmaProgramSchema),
  postAttendProgram
);
router.post('/appointments/:appointmentCode/treatment-plan', postTreatmentPlanFromAppointment);
router.get('/programs/:programCode', getProgram);

export default router;
