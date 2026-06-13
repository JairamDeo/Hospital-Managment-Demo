import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { portalAuth } from '../../middleware/portalAuthMiddleware.js';
import { staffDocumentUpload } from '../../middleware/staffDocumentUpload.middleware.js';
import {
  adminCreateStaffSchema,
  adminUpdateStaffSchema,
  staffCompensationUpdateSchema,
} from '../validators/hmsStaff.validator.js';
import {
  applyLeaveSchema,
  leaveDaysQuerySchema,
} from '../validators/staffProfile.validator.js';
import {
  getStaffList,
  getStaffStatsSummary,
  getStaff,
  postStaff,
  patchStaff,
  getStaffCompensationList,
  patchStaffCompensation,
} from '../controllers/hmsStaff.controller.js';
import {
  getActivity,
  postCheckIn,
  postCheckOut,
  getDocuments,
  postDocument,
  downloadDocument,
  getLeave,
  postLeave,
  getPendingLeave,
  patchApproveLeave,
  patchRejectLeave,
  previewLeaveDays,
} from '../controllers/staffProfile.controller.js';

const router = Router();

router.use(portalAuth);

router.get('/', getStaffList);
router.get('/stats/summary', getStaffStatsSummary);
router.get('/compensation/list', getStaffCompensationList);

router.get('/leave/pending', getPendingLeave);
router.get('/leave/preview-days', validateRequest(leaveDaysQuerySchema, 'query'), previewLeaveDays);
router.patch('/leave/:leaveId/approve', patchApproveLeave);
router.patch('/leave/:leaveId/reject', patchRejectLeave);

router.get('/:staffCode/activity', getActivity);
router.post('/:staffCode/activity/check-in', postCheckIn);
router.post('/:staffCode/activity/check-out', postCheckOut);

router.get('/:staffCode/documents', getDocuments);
router.post(
  '/:staffCode/documents',
  staffDocumentUpload.single('file'),
  postDocument
);
router.get('/:staffCode/documents/:docId/download', downloadDocument);

router.get('/:staffCode/leave', getLeave);
router.post('/:staffCode/leave', validateRequest(applyLeaveSchema), postLeave);

router.patch(
  '/:staffCode/compensation',
  validateRequest(staffCompensationUpdateSchema),
  patchStaffCompensation
);
router.get('/:staffCode', getStaff);
router.post('/', validateRequest(adminCreateStaffSchema), postStaff);
router.patch('/:staffCode', validateRequest(adminUpdateStaffSchema), patchStaff);

export default router;
