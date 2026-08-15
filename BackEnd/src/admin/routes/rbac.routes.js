import { Router } from 'express';
import { portalAuth, requireAdminOnly } from '../../middleware/portalAuthMiddleware.js';
import { getRbacConfigs, patchRbacConfig } from '../controllers/rbac.controller.js';

const router = Router();

router.use(portalAuth, requireAdminOnly);

router.get('/', getRbacConfigs);
router.patch('/:role', patchRbacConfig);

export default router;
