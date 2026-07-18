import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { portalAuth } from '../../middleware/portalAuthMiddleware.js';
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
  getPharmacySpoonList,
  postPharmacySpoon,
  patchPharmacySpoon,
  postPharmacySpoonDefault,
  getRoomList,
  postRoom,
  patchRoom,
  getLabCategoryList,
  postLabCategory,
  patchLabCategory,
  getLabTestList,
  postLabTest,
  patchLabTest,
} from '../controllers/master.controller.js';
import {
  createPharmacySpoonSchema,
  updatePharmacySpoonSchema,
} from '../validators/pharmacySpoon.validator.js';
import { createRoomSchema, updateRoomSchema } from '../validators/room.validator.js';
import { createLabTestSchema, updateLabTestSchema } from '../validators/labTest.validator.js';

const router = Router();

router.use(portalAuth);

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

router.get('/pharmacy-spoons', getPharmacySpoonList);
router.post('/pharmacy-spoons', validateRequest(createPharmacySpoonSchema), postPharmacySpoon);
router.patch('/pharmacy-spoons/:id', validateRequest(updatePharmacySpoonSchema), patchPharmacySpoon);
router.post('/pharmacy-spoons/:id/default', postPharmacySpoonDefault);

router.get('/rooms', getRoomList);
router.post('/rooms', validateRequest(createRoomSchema), postRoom);
router.patch('/rooms/:id', validateRequest(updateRoomSchema), patchRoom);

router.get('/lab-categories', getLabCategoryList);
router.post('/lab-categories', validateRequest(masterNameSchema), postLabCategory);
router.patch('/lab-categories/:id', validateRequest(masterUpdateSchema), patchLabCategory);

router.get('/lab-tests', getLabTestList);
router.post('/lab-tests', validateRequest(createLabTestSchema), postLabTest);
router.patch('/lab-tests/:id', validateRequest(updateLabTestSchema), patchLabTest);

export default router;
