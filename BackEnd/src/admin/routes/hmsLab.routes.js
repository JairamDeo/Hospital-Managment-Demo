import { Router } from 'express';
import { portalAuth } from '../../middleware/portalAuthMiddleware.js';
import { labReportUpload } from '../../middleware/labReportUpload.middleware.js';
import {
  getLabStats,
  getLabOrders,
  getLabOrder,
  getLabReports,
  postLabReportUpload,
  getMyNotifications,
  postMarkNotificationRead,
  postMarkAllNotificationsRead,
} from '../controllers/hmsLab.controller.js';

const router = Router();

router.use(portalAuth);

router.get('/stats/summary', getLabStats);
router.get('/orders', getLabOrders);
router.get('/orders/:orderCode', getLabOrder);
router.get('/reports', getLabReports);
router.post('/reports/upload', (req, res, next) => {
  labReportUpload(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message, status_code: 400, res: null });
    return next();
  });
}, postLabReportUpload);

router.get('/notifications', getMyNotifications);
router.post('/notifications/read-all', postMarkAllNotificationsRead);
router.post('/notifications/:id/read', postMarkNotificationRead);

export default router;
