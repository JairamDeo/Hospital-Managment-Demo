import HmsNotification from '../models/hmsNotification.model.js';
import HmsStaff from '../models/hmsStaff.model.js';
import { logger } from '../utils/logger.js';

export const createNotification = async (payload) => {
  try {
    return await HmsNotification.create(payload);
  } catch (error) {
    logger.warn(`Notification create failed: ${error.message}`);
    return null;
  }
};

export const notifyAllLabStaff = async ({ title, message, href = '', meta = {} }) => {
  const labStaff = await HmsStaff.find({ role: 'Lab', status: true }).select('staffCode name').lean();
  if (!labStaff.length) {
    await createNotification({
      audience: 'lab',
      title,
      message,
      href,
      type: 'lab_order',
      meta,
    });
    return;
  }

  await Promise.all(
    labStaff.map((staff) =>
      createNotification({
        audience: 'lab',
        staffCode: staff.staffCode,
        title,
        message,
        href,
        type: 'lab_order',
        meta,
      })
    )
  );
};

export const notifyDoctor = async (doctorStaffCode, { title, message, href = '', meta = {} }) => {
  if (!doctorStaffCode) {
    await createNotification({
      audience: 'doctor',
      title,
      message,
      href,
      type: 'lab_report',
      meta,
    });
    return;
  }
  await createNotification({
    audience: 'doctor',
    staffCode: doctorStaffCode,
    title,
    message,
    href,
    type: 'lab_report',
    meta,
  });
};

export const listNotificationsForUser = async (req, { limit = 30 } = {}) => {
  const query = {};

  if (req.accountType === 'admin') {
    query.audience = { $in: ['admin', 'lab', 'doctor'] };
  } else if (req.accountType === 'staff') {
    const role = req.staff?.role;
    const staffCode = req.staff?.staffCode || '';
    if (role === 'Lab') {
      query.$or = [
        { audience: 'lab', staffCode },
        { audience: 'lab', staffCode: '' },
      ];
    } else if (role === 'Doctor') {
      query.$or = [
        { audience: 'doctor', staffCode },
        { audience: 'doctor', staffCode: '' },
      ];
    } else {
      query.$or = [
        { audience: 'staff', staffCode },
        { audience: 'staff', staffCode: '' },
      ];
    }
  } else if (req.accountType === 'patient') {
    query.audience = 'patient';
    query.patientCode = req.patient?.patientCode || '';
  } else {
    return [];
  }

  return HmsNotification.find(query).sort({ createdAt: -1 }).limit(limit).lean();
};

export const markNotificationRead = async (id, req) => {
  const row = await HmsNotification.findById(id);
  if (!row) return null;

  // Ensure caller can see this notification before marking read
  const visible = await listNotificationsForUser(req, { limit: 200 });
  const ok = visible.some((n) => String(n._id) === String(row._id));
  if (!ok) return null;

  row.readAt = new Date();
  await row.save();
  return row;
};

export const markAllNotificationsRead = async (req) => {
  const visible = await listNotificationsForUser(req, { limit: 200 });
  const unreadIds = visible.filter((n) => !n.readAt).map((n) => n._id);
  if (!unreadIds.length) return { updated: 0 };
  await HmsNotification.updateMany(
    { _id: { $in: unreadIds } },
    { $set: { readAt: new Date() } }
  );
  return { updated: unreadIds.length };
};
