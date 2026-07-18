import { customResponse } from '../../utils/response.js';
import { ErrorMessages, LAB_MESSAGES } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';
import { resolveApiErrorMessage } from '../../utils/resolveApiErrorMessage.js';
import {
  listLabOrders,
  getLabOrderByCode,
  listLabReports,
  getLabDashboardStats,
  uploadLabReport,
} from '../services/hmsLab.service.js';
import {
  listNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../services/notification.service.js';

export const getLabStats = async (_req, res) => {
  try {
    const stats = await getLabDashboardStats();
    return customResponse(res, LAB_MESSAGES.STATS_FETCHED, 200, { stats });
  } catch (error) {
    logger.error('Lab stats error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getLabOrders = async (req, res) => {
  try {
    const orders = await listLabOrders({
      status: req.query.status,
      patientCode: req.query.patientCode,
      search: req.query.search,
      testCode: req.query.testCode,
      categoryCode: req.query.categoryCode,
    });
    return customResponse(res, LAB_MESSAGES.ORDERS_FETCHED, 200, { orders });
  } catch (error) {
    logger.error('Lab orders list error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getLabOrder = async (req, res) => {
  try {
    const order = await getLabOrderByCode(req.params.orderCode);
    return customResponse(res, LAB_MESSAGES.ORDER_FETCHED, 200, { order });
  } catch (error) {
    if (error.message === LAB_MESSAGES.NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    logger.error('Lab order get error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getLabReports = async (req, res) => {
  try {
    const reports = await listLabReports({
      patientCode: req.query.patientCode,
      categoryCode: req.query.categoryCode,
      testCode: req.query.testCode,
      search: req.query.search,
    });
    return customResponse(res, LAB_MESSAGES.REPORTS_FETCHED, 200, { reports });
  } catch (error) {
    logger.error('Lab reports list error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postLabReportUpload = async (req, res) => {
  try {
    const report = await uploadLabReport(req.body, req.file, req);
    return customResponse(res, LAB_MESSAGES.REPORT_UPLOADED, 201, { report });
  } catch (error) {
    const known = [
      LAB_MESSAGES.NOT_FOUND,
      LAB_MESSAGES.TESTS_REQUIRED,
      LAB_MESSAGES.FILE_REQUIRED,
      ErrorMessages.PATIENT_NOT_FOUND,
    ];
    if (known.includes(error.message)) {
      return customResponse(res, error.message, 400);
    }
    if (/cloudinary|not configured/i.test(String(error.message))) {
      return customResponse(res, error.message, 503);
    }
    logger.error('Lab report upload error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await listNotificationsForUser(req);
    return customResponse(res, 'Notifications fetched', 200, { notifications });
  } catch (error) {
    logger.error('Notifications list error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postMarkNotificationRead = async (req, res) => {
  try {
    const notification = await markNotificationRead(req.params.id, req);
    if (!notification) return customResponse(res, 'Notification not found', 404);
    return customResponse(res, 'Notification marked read', 200, {
      notification: {
        _id: String(notification._id),
        readAt: notification.readAt,
      },
    });
  } catch (error) {
    logger.error('Mark notification read error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postMarkAllNotificationsRead = async (req, res) => {
  try {
    const result = await markAllNotificationsRead(req);
    return customResponse(res, 'All notifications marked read', 200, result);
  } catch (error) {
    logger.error('Mark all notifications read error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};
