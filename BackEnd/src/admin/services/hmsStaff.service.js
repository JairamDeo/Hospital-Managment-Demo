import HmsStaff from '../../models/hmsStaff.model.js';
import { ErrorMessages } from '../../utils/constants.js';
import { formatHmsStaff } from '../../utils/formatHmsStaff.js';
import { generateHmsStaffCode } from '../../utils/generateHmsStaffCode.js';
import {
  STAFF_DEFAULT_PASSWORD,
  staffEmailFromName,
} from '../../utils/staffCredentials.util.js';

const statLabelForRole = (role) => {
  if (role === 'Support') return 'Handled';
  return 'Patients';
};

export const listStaff = async () => {
  const staff = await HmsStaff.find({ status: true }).sort({ staffCode: 1 });
  return staff.map(formatHmsStaff);
};

export const getStaffByCode = async (staffCode) => {
  const member = await HmsStaff.findOne({ staffCode, status: true });
  if (!member) return null;
  return formatHmsStaff(member);
};

export const getStaffStats = async () => {
  const base = { status: true };
  const [total, onDuty, doctors, therapists, support] = await Promise.all([
    HmsStaff.countDocuments(base),
    HmsStaff.countDocuments({ ...base, dutyStatus: 'On Duty' }),
    HmsStaff.countDocuments({ ...base, role: 'Doctor' }),
    HmsStaff.countDocuments({ ...base, role: 'Therapist' }),
    HmsStaff.countDocuments({ ...base, role: 'Support' }),
  ]);

  return { total, onDuty, doctors, therapists, support };
};

export const createStaffByAdmin = async (payload) => {
  const staffCode = await generateHmsStaffCode();
  const role = payload.role;

  const name = payload.name.trim();
  let email = staffEmailFromName(name);
  const emailTaken = await HmsStaff.findOne({ email });
  if (emailTaken) {
    email = staffEmailFromName(name, staffCode);
  }

  const member = await HmsStaff.create({
    staffCode,
    name,
    role,
    title: payload.title?.trim() || '',
    dutyStatus: 'On Duty',
    statPrimaryValue: 0,
    statPrimaryLabel: statLabelForRole(role),
    todayCount: 0,
    todayLabel: 'Today',
    rating: 5,
    tags: payload.tags?.length ? payload.tags : [role],
    shift: payload.shift?.trim() || '9AM – 5PM',
    email,
    password: STAFF_DEFAULT_PASSWORD,
    status: true,
  });

  return formatHmsStaff(member);
};

export const updateStaffByAdmin = async (staffCode, payload) => {
  const member = await HmsStaff.findOne({ staffCode });
  if (!member) throw new Error(ErrorMessages.STAFF_NOT_FOUND);

  if (payload.name !== undefined) member.name = payload.name.trim();
  if (payload.role !== undefined) member.role = payload.role;
  if (payload.title !== undefined) member.title = payload.title.trim();
  if (payload.dutyStatus !== undefined) member.dutyStatus = payload.dutyStatus;
  if (payload.shift !== undefined) member.shift = payload.shift.trim();
  if (payload.tags !== undefined) member.tags = payload.tags;
  if (payload.rating !== undefined) member.rating = payload.rating;
  if (payload.statPrimaryValue !== undefined) member.statPrimaryValue = payload.statPrimaryValue;
  if (payload.todayCount !== undefined) member.todayCount = payload.todayCount;

  if (payload.role !== undefined) {
    member.statPrimaryLabel = statLabelForRole(member.role);
  }

  await member.save();
  return formatHmsStaff(member);
};
