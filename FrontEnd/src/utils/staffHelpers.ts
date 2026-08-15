import type { HmsStaff } from '@/types/api.types';
import type {
  StaffFilter,
  StaffFormValues,
  StaffMember,
  StaffRole,
  StaffStats,
} from '@/types/staff.types';

const AVATAR_CLASSES = [
  'bg-violet-100 text-violet-700',
  'bg-pink-100 text-pink-700',
  'bg-emerald-100 text-emerald-800',
  'bg-blue-100 text-blue-700',
  'bg-amber-100 text-amber-800',
  'bg-teal-100 text-teal-800',
];

export const pickAvatarClass = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash += seed.charCodeAt(i);
  return AVATAR_CLASSES[hash % AVATAR_CLASSES.length];
};

export const getInitials = (name: string) => {
  const parts = name.replace(/^Dr\.\s*/i, '').trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export const emptyStaffForm = (): StaffFormValues => ({
  name: '',
  role: 'Doctor',
  title: '',
  shift: '9AM – 5PM',
  registrationNumber: '',
  aadharNumber: '',
  panNumber: '',
  qualifications: [{ level: 'UG', degree: '' }],
});

export const filterToRole = (filter: StaffFilter): StaffRole | null => {
  const map: Record<Exclude<StaffFilter, 'all'>, StaffRole> = {
    doctor: 'Doctor',
    therapist: 'Therapist',
    support: 'Support',
  };
  return filter === 'all' ? null : map[filter];
};

export const defaultStaffStats = (): StaffStats => ({
  total: 0,
  onDuty: 0,
  doctors: 0,
  therapists: 0,
  support: 0,
});

export const hmsToStaff = (s: HmsStaff): StaffMember => ({
  id: s.staffCode ?? s.id,
  name: s.name,
  role: s.role,
  title: s.title,
  initials: getInitials(s.name),
  avatarClass: pickAvatarClass(s.name),
  status: (s.dutyStatus ?? s.status ?? 'On Duty') as StaffMember['status'],
  statPrimary: {
    value: s.statPrimaryValue ?? 0,
    label: s.statPrimaryLabel ?? 'Patients',
  },
  today: s.todayCount ?? 0,
  todayLabel: s.todayLabel ?? 'Today',
  rating: s.rating ?? 5,
  tags: s.tags ?? [],
  shift: s.shift ?? '9AM – 5PM',
});
