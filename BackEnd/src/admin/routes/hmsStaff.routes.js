import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { portalAuth } from '../../middleware/portalAuthMiddleware.js';
import {
  adminCreateStaffSchema,
  adminUpdateStaffSchema,
} from '../validators/hmsStaff.validator.js';
import {
  getStaffList,
  getStaffStatsSummary,
  getStaff,
  postStaff,
  patchStaff,
} from '../controllers/hmsStaff.controller.js';

const router = Router();

router.use(portalAuth);

router.get('/', getStaffList);
router.get('/stats/summary', getStaffStatsSummary);
router.get('/:staffCode', getStaff);
router.post('/', validateRequest(adminCreateStaffSchema), postStaff);
router.patch('/:staffCode', validateRequest(adminUpdateStaffSchema), patchStaff);

export default router;
