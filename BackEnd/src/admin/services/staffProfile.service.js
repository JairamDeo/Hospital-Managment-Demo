import fs from 'fs';
import path from 'path';
import moment from 'moment';
import StaffDocument from '../../models/staffDocument.model.js';
import StaffActivity from '../../models/staffActivity.model.js';
import StaffLeave from '../../models/staffLeave.model.js';
import HmsStaff from '../../models/hmsStaff.model.js';
import { ErrorMessages } from '../../utils/constants.js';
import {
  countLeaveDaysExcludingSunday,
  datesInRangeExcludingSunday,
} from '../../utils/leaveDays.util.js';

const decodeStaffCode = (code) => decodeURIComponent(code ?? '').trim();

const resolveStaff = async (staffCode) => {
  const member = await HmsStaff.findOne({ staffCode, status: true });
  if (!member) throw new Error(ErrorMessages.STAFF_NOT_FOUND);
  return member;
};

const assertStaffAccess = (req, staffCode) => {
  if (req.accountType === 'admin') return;
  if (req.accountType === 'staff' && req.staff?.staffCode === staffCode) return;
  throw new Error(ErrorMessages.ACCESS_DENIED);
};

const assertAdmin = (req) => {
  if (req.accountType !== 'admin') throw new Error(ErrorMessages.ACCESS_DENIED);
};

const performerFromReq = (req) => {
  if (req.accountType === 'admin') {
    return {
      type: 'admin',
      name: req.admin?.firstName
        ? `${req.admin.firstName} ${req.admin.lastName || ''}`.trim()
        : req.admin?.email || 'Admin',
      adminId: req.admin?._id,
    };
  }
  return {
    type: 'staff',
    name: req.staff?.name || 'Staff',
    staffCode: req.staff?.staffCode,
  };
};

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatActivity = (row) => ({
  id: String(row._id),
  activityType: row.activityType,
  title: row.title,
  dateRange: moment(row.createdAt).format('DD MMM YYYY, hh:mm A'),
  status: row.activityType === 'check_in' ? 'Active' : 'Completed',
  description: row.description,
  tags: row.tags ?? [],
  createdAt: row.createdAt,
});

const formatDocument = (row) => ({
  id: String(row._id),
  name: row.name,
  type: row.fileType,
  uploadedAt: moment(row.createdAt).format('DD MMM YYYY'),
  size: formatBytes(row.bytes),
  downloadUrl: `/admin/staff/${encodeURIComponent(row.staffCode)}/documents/${row._id}/download`,
});

const formatLeave = (row) => ({
  id: String(row._id),
  leaveCode: row.leaveCode,
  type: row.leaveType,
  from: moment(row.startDate).format('DD MMM YYYY'),
  to: moment(row.endDate).format('DD MMM YYYY'),
  days: row.totalDays,
  leaveDates: row.leaveDates,
  status: row.status,
  appliedAt: row.createdAt,
  reviewedAt: row.reviewedAt,
});

const logActivity = async (staffCode, payload) => {
  const row = await StaffActivity.create({ staffCode, ...payload });
  return formatActivity(row);
};

const nextLeaveCode = async () => {
  const count = await StaffLeave.countDocuments();
  return `LV-${String(count + 1).padStart(4, '0')}`;
};

export const listStaffActivity = async (req, staffCodeRaw) => {
  const staffCode = decodeStaffCode(staffCodeRaw);
  await resolveStaff(staffCode);
  assertStaffAccess(req, staffCode);

  const rows = await StaffActivity.find({ staffCode }).sort({ createdAt: -1 }).limit(100);
  return rows.map(formatActivity);
};

const assertOwnStaffOnly = (req, staffCode) => {
  if (req.accountType === 'staff' && req.staff?.staffCode === staffCode) return;
  throw new Error(ErrorMessages.ACCESS_DENIED);
};

export const staffCheckIn = async (req, staffCodeRaw) => {
  const staffCode = decodeStaffCode(staffCodeRaw);
  const member = await resolveStaff(staffCode);
  assertOwnStaffOnly(req, staffCode);

  const performer = performerFromReq(req);
  return logActivity(staffCode, {
    activityType: 'check_in',
    title: 'Checked in',
    description: `${member.name} checked in for today's shift (${member.shift}).`,
    tags: ['Attendance'],
    performedBy: performer,
  });
};

export const staffCheckOut = async (req, staffCodeRaw) => {
  const staffCode = decodeStaffCode(staffCodeRaw);
  const member = await resolveStaff(staffCode);
  assertOwnStaffOnly(req, staffCode);

  const performer = performerFromReq(req);
  return logActivity(staffCode, {
    activityType: 'check_out',
    title: 'Checked out',
    description: `${member.name} checked out after completing today's shift.`,
    tags: ['Attendance'],
    performedBy: performer,
  });
};

export const listStaffDocuments = async (req, staffCodeRaw) => {
  const staffCode = decodeStaffCode(staffCodeRaw);
  await resolveStaff(staffCode);
  assertStaffAccess(req, staffCode);

  const rows = await StaffDocument.find({ staffCode }).sort({ createdAt: -1 });
  return rows.map(formatDocument);
};

export const uploadStaffDocument = async (req, staffCodeRaw, file, title) => {
  const staffCode = decodeStaffCode(staffCodeRaw);
  await resolveStaff(staffCode);
  assertAdmin(req);

  if (!file?.buffer) throw new Error('Please upload a file');

  const ext = path.extname(file.originalname || '') || '.pdf';
  const safeName = `${Date.now()}-${(title || file.originalname || 'document').replace(/[^\w.\-() ]/g, '_')}${ext.includes('.') ? '' : ext}`;
  const dir = path.join(process.cwd(), 'upload', 'staff', staffCode);
  fs.mkdirSync(dir, { recursive: true });
  const relPath = path.join('staff', staffCode, safeName).replace(/\\/g, '/');
  const absPath = path.join(process.cwd(), 'upload', relPath);
  fs.writeFileSync(absPath, file.buffer);

  const fileType =
    file.mimetype === 'application/pdf'
      ? 'PDF'
      : file.mimetype?.includes('word')
        ? 'DOC'
        : file.mimetype?.includes('image')
          ? 'IMAGE'
          : 'FILE';

  const row = await StaffDocument.create({
    staffCode,
    name: title?.trim() || file.originalname || 'Document',
    fileType,
    filePath: relPath,
    bytes: file.size ?? file.buffer.length,
    uploadedBy: performerFromReq(req),
  });

  return formatDocument(row);
};

export const getStaffDocumentFile = async (req, staffCodeRaw, docId) => {
  const staffCode = decodeStaffCode(staffCodeRaw);
  await resolveStaff(staffCode);
  assertStaffAccess(req, staffCode);

  const doc = await StaffDocument.findOne({ _id: docId, staffCode });
  if (!doc) throw new Error('Document not found');

  const absPath = path.join(process.cwd(), 'upload', doc.filePath);
  if (!fs.existsSync(absPath)) throw new Error('Document file missing on server');
  return { doc, absPath };
};

export const listStaffLeave = async (req, staffCodeRaw) => {
  const staffCode = decodeStaffCode(staffCodeRaw);
  await resolveStaff(staffCode);
  assertStaffAccess(req, staffCode);

  const rows = await StaffLeave.find({ staffCode }).sort({ createdAt: -1 });
  return rows.map(formatLeave);
};

export const applyStaffLeave = async (req, staffCodeRaw, payload) => {
  const staffCode = decodeStaffCode(staffCodeRaw);
  const member = await resolveStaff(staffCode);

  if (req.accountType === 'staff' && req.staff?.staffCode !== staffCode) {
    throw new Error(ErrorMessages.ACCESS_DENIED);
  }

  const { leaveType, startDate, endDate } = payload;
  const leaveDates = datesInRangeExcludingSunday(startDate, endDate);
  const totalDays = leaveDates.length;

  if (totalDays < 1) {
    throw new Error('Select at least one working day (Sundays are excluded)');
  }

  const row = await StaffLeave.create({
    leaveCode: await nextLeaveCode(),
    staffCode,
    staffName: member.name,
    leaveType,
    startDate,
    endDate,
    leaveDates,
    totalDays,
    status: 'Pending',
    appliedBy: performerFromReq(req),
  });

  await logActivity(staffCode, {
    activityType: 'leave_applied',
    title: `${leaveType} leave applied`,
    description: `${member.name} applied for ${leaveType} leave (${totalDays} day${totalDays === 1 ? '' : 's'}): ${leaveDates.map((d) => moment(d).format('DD MMM')).join(', ')}.`,
    tags: ['Leave', leaveType, 'Pending'],
    meta: { leaveId: String(row._id), leaveCode: row.leaveCode },
    performedBy: performerFromReq(req),
  });

  return formatLeave(row);
};

export const listPendingLeave = async (req) => {
  assertAdmin(req);
  const rows = await StaffLeave.find({ status: 'Pending' }).sort({ createdAt: -1 });
  return rows.map((r) => ({
    ...formatLeave(r),
    staffCode: r.staffCode,
    staffName: r.staffName,
  }));
};

export const approveStaffLeave = async (req, leaveId) => {
  assertAdmin(req);
  const row = await StaffLeave.findById(leaveId);
  if (!row) throw new Error('Leave request not found');
  if (row.status !== 'Pending') throw new Error('Leave request already processed');

  row.status = 'Approved';
  row.reviewedBy = performerFromReq(req);
  row.reviewedAt = new Date();
  await row.save();

  await logActivity(row.staffCode, {
    activityType: 'leave_approved',
    title: `${row.leaveType} leave approved`,
    description: `${row.staffName}'s ${row.leaveType} leave (${row.totalDays} day${row.totalDays === 1 ? '' : 's'}) was approved.`,
    tags: ['Leave', row.leaveType, 'Approved'],
    meta: { leaveId: String(row._id), leaveCode: row.leaveCode },
    performedBy: performerFromReq(req),
  });

  return formatLeave(row);
};

export const rejectStaffLeave = async (req, leaveId) => {
  assertAdmin(req);
  const row = await StaffLeave.findById(leaveId);
  if (!row) throw new Error('Leave request not found');
  if (row.status !== 'Pending') throw new Error('Leave request already processed');

  row.status = 'Rejected';
  row.reviewedBy = performerFromReq(req);
  row.reviewedAt = new Date();
  await row.save();

  await logActivity(row.staffCode, {
    activityType: 'leave_rejected',
    title: `${row.leaveType} leave rejected`,
    description: `${row.staffName}'s ${row.leaveType} leave request was rejected.`,
    tags: ['Leave', row.leaveType, 'Rejected'],
    meta: { leaveId: String(row._id), leaveCode: row.leaveCode },
    performedBy: performerFromReq(req),
  });

  return formatLeave(row);
};

export { countLeaveDaysExcludingSunday, datesInRangeExcludingSunday };
