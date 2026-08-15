import { attachCompensation } from './staffCompensation.util.js';

const statLabelForRole = (role) => {
  if (role === 'Support') return 'Handled';
  return 'Patients';
};

export const formatHmsStaff = (doc) => {
  const s = doc.toObject ? doc.toObject() : { ...doc };
  const pay = attachCompensation(s);

  return {
    _id: String(s._id),
    staffCode: s.staffCode,
    id: s.staffCode,
    name: s.name,
    role: s.role,
    title: s.title || '',
    dutyStatus: s.dutyStatus,
    status: s.dutyStatus,
    statPrimaryValue: s.statPrimaryValue ?? 0,
    statPrimaryLabel: s.statPrimaryLabel || statLabelForRole(s.role),
    todayCount: s.todayCount ?? 0,
    todayLabel: s.todayLabel || 'Today',
    rating: s.rating ?? 5,
    tags: Array.isArray(s.tags) ? s.tags : [],
    shift: s.shift || '9AM – 5PM',
    consultationFee: pay.consultationFee,
    compensation: pay.compensation,
    grossMonthly: pay.grossMonthly,
    totalDeductions: pay.totalDeductions,
    netMonthly: pay.netMonthly,
    qualifications: Array.isArray(s.qualifications) ? s.qualifications : [],
    registrationNumber: s.registrationNumber || '',
    aadharNumber: s.aadharNumber || '',
    panNumber: s.panNumber || '',
    email: s.email || '',
    accountActive: s.status,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
};

export const formatStaffCompensationRow = (doc) => {
  const s = doc.toObject ? doc.toObject() : { ...doc };
  const pay = attachCompensation(s);
  return {
    staffCode: s.staffCode,
    name: s.name,
    role: s.role,
    title: s.title || '',
    shift: s.shift || '9AM – 5PM',
    consultationFee: pay.consultationFee,
    compensation: pay.compensation,
    grossMonthly: pay.grossMonthly,
    totalDeductions: pay.totalDeductions,
    netMonthly: pay.netMonthly,
  };
};
