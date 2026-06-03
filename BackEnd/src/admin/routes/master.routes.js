import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { adminAuth } from '../../middleware/adminAuthMiddleware.js';
import { masterNameSchema, masterUpdateSchema } from '../validators/hmsPatient.validator.js';
import {
  getPrakritiList,
  postPrakriti,
  patchPrakriti,
  getTreatmentList,
  postTreatment,
  patchTreatment,
  getPharmacyCategoryList,
  postPharmacyCategory,
  patchPharmacyCategory,
  getPharmacyUnitList,
  postPharmacyUnit,
  patchPharmacyUnit,
} from '../controllers/master.controller.js';

const router = Router();

router.use(adminAuth);

router.get('/prakriti', getPrakritiList);
router.post('/prakriti', validateRequest(masterNameSchema), postPrakriti);
router.patch('/prakriti/:id', validateRequest(masterUpdateSchema), patchPrakriti);

router.get('/treatments', getTreatmentList);
router.post('/treatments', validateRequest(masterNameSchema), postTreatment);
router.patch('/treatments/:id', validateRequest(masterUpdateSchema), patchTreatment);

router.get('/pharmacy-categories', getPharmacyCategoryList);
router.post('/pharmacy-categories', validateRequest(masterNameSchema), postPharmacyCategory);
router.patch(
  '/pharmacy-categories/:id',
  validateRequest(masterUpdateSchema),
  patchPharmacyCategory
);

router.get('/pharmacy-units', getPharmacyUnitList);
router.post('/pharmacy-units', validateRequest(masterNameSchema), postPharmacyUnit);
router.patch('/pharmacy-units/:id', validateRequest(masterUpdateSchema), patchPharmacyUnit);

export default router;
