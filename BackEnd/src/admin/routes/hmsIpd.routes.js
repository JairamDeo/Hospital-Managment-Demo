import { Router } from 'express';
import { portalAuth } from '../../middleware/portalAuthMiddleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import {
  getAdmissions,
  getStats,
  getRooms,
  getAdmission,
  postAdmission,
  postCaseNote,
  postDischarge,
} from '../controllers/hmsIpd.controller.js';
import {
  createIpdAdmissionSchema,
  addIpdCaseNoteSchema,
  dischargeIpdSchema,
} from '../validators/hmsIpd.validator.js';

const router = Router();

router.use(portalAuth);

router.get('/admissions', getAdmissions);
router.get('/stats', getStats);
router.get('/rooms', getRooms);
router.get('/admissions/:admissionCode', getAdmission);
router.post('/admissions', validateRequest(createIpdAdmissionSchema), postAdmission);
router.post(
  '/admissions/:admissionCode/case-notes',
  validateRequest(addIpdCaseNoteSchema),
  postCaseNote
);
router.post(
  '/admissions/:admissionCode/discharge',
  validateRequest(dischargeIpdSchema),
  postDischarge
);

export default router;
