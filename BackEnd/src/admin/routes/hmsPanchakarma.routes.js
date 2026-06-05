import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { portalAuth } from '../../middleware/portalAuthMiddleware.js';
import { createPanchakarmaProgramSchema } from '../validators/hmsPanchakarma.validator.js';
import {
  getPrograms,
  getProgramsStats,
  getStaffPrograms,
  getTherapists,
  getRooms,
  postProgram,
} from '../controllers/hmsPanchakarma.controller.js';

const router = Router();

router.use(portalAuth);

router.get('/programs', getPrograms);
router.get('/programs/stats/summary', getProgramsStats);
router.get('/programs/therapists', getTherapists);
router.get('/programs/rooms', getRooms);
router.get('/programs/staff/:staffCode', getStaffPrograms);
router.post('/programs', validateRequest(createPanchakarmaProgramSchema), postProgram);

export default router;
