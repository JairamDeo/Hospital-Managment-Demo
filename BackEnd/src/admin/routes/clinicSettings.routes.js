import { Router } from 'express';
import { portalAuth, requireAdminOnly } from '../../middleware/portalAuthMiddleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { updateClinicSettingsSchema } from '../validators/clinicSettings.validator.js';
import {
  getClinicSettings,
  patchClinicSettings,
} from '../controllers/clinicSettings.controller.js';

const router = Router();

router.get('/', portalAuth, getClinicSettings);
router.patch(
  '/',
  portalAuth,
  requireAdminOnly,
  validateRequest(updateClinicSettingsSchema),
  patchClinicSettings
);

export default router;
