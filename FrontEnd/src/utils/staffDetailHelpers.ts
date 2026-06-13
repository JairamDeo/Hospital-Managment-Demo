import type { HmsStaff } from '@/types/api.types';
import type { StaffProfileCardData } from '@/types/staffProfile.types';
import { getInitials, pickAvatarClass } from '@/utils/staffHelpers';

const departmentForRole = (role: HmsStaff['role']) => {
  if (role === 'Doctor') return 'Clinical · OPD';
  if (role === 'Therapist') return 'Panchakarma Therapy';
  return 'Front Desk & Admin';
};

export const hmsToStaffProfileCard = (s: HmsStaff): StaffProfileCardData => ({
  id: s.staffCode ?? s.id,
  name: s.name,
  role: s.role,
  title: s.title,
  status: (s.dutyStatus ?? s.status ?? 'On Duty') as StaffProfileCardData['status'],
  initials: getInitials(s.name),
  avatarClass: pickAvatarClass(s.name),
  email: s.email ?? '',
  phone: '+91 98000 00000',
  department: departmentForRole(s.role),
  joinedDate: 'Jan 2019',
  experience: '—',
  shift: s.shift ?? '9AM – 5PM',
  tags: s.tags ?? [],
  consultationFee: s.role === 'Doctor' ? Number(s.consultationFee) || 0 : undefined,
  netMonthly: Number(s.netMonthly) || 0,
  grossMonthly: Number(s.grossMonthly) || 0,
  qualifications: s.qualifications ?? [],
  registrationNumber: s.registrationNumber ?? '',
  aadharNumber: s.aadharNumber ?? '',
  panNumber: s.panNumber ?? '',
});
