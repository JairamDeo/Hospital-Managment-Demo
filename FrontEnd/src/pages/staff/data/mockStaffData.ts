import type { StaffMember, StaffStats } from '@/types/staff.types';
import { getInitials, pickAvatarClass } from '@/utils/staffHelpers';

type RawStaff = {
  id: string;
  name: string;
  role: StaffMember['role'];
  title: string;
  status: StaffMember['status'];
  statPrimary: StaffMember['statPrimary'];
  today: number;
  rating: number;
  tags: string[];
  shift: string;
};

const RAW_STAFF: RawStaff[] = [
  { id: 'STF-001', name: 'Dr. Ananya Sharma', role: 'Doctor', title: 'Chief Physician · OPD', status: 'On Duty', statPrimary: { value: 284, label: 'Patients' }, today: 12, rating: 4.9, tags: ['Panchakarma', 'Prakriti'], shift: '9AM – 5PM' },
  { id: 'STF-007', name: 'Dr. Vijay Patel', role: 'Doctor', title: 'Senior Physician · IPD', status: 'On Duty', statPrimary: { value: 210, label: 'Patients' }, today: 9, rating: 4.7, tags: ['IPD', 'Follow-up'], shift: '9AM – 5PM' },
  { id: 'STF-008', name: 'Dr. Meera Joshi', role: 'Doctor', title: 'Diet & Lifestyle Consultant', status: 'On Duty', statPrimary: { value: 175, label: 'Patients' }, today: 7, rating: 4.8, tags: ['Diet', 'Prakriti'], shift: '10AM – 4PM' },
  { id: 'STF-002', name: 'Dr. Rekha Nair', role: 'Therapist', title: 'Vamana Specialist', status: 'On Duty', statPrimary: { value: 196, label: 'Patients' }, today: 8, rating: 4.8, tags: ['Vamana', 'Virechana'], shift: '9AM – 6PM' },
  { id: 'STF-003', name: 'Dr. Sanjay Mehta', role: 'Therapist', title: 'Basti Therapist', status: 'On Duty', statPrimary: { value: 148, label: 'Patients' }, today: 6, rating: 4.7, tags: ['Basti', 'Shodhana'], shift: '10AM – 6PM' },
  { id: 'STF-004', name: 'Dr. Kavita Rao', role: 'Therapist', title: 'Nasya Specialist', status: 'On Duty', statPrimary: { value: 120, label: 'Patients' }, today: 5, rating: 4.6, tags: ['Nasya', 'Shirodhara'], shift: '11AM – 7PM' },
  { id: 'STF-006', name: 'Amit Verma', role: 'Support', title: 'Reception Lead', status: 'On Duty', statPrimary: { value: 184, label: 'Handled' }, today: 24, rating: 4.9, tags: ['Front Desk', 'Billing'], shift: '8AM – 5PM' },
];

export const MOCK_STAFF: StaffMember[] = RAW_STAFF.map((s) => ({
  ...s,
  todayLabel: 'Today',
  initials: getInitials(s.name),
  avatarClass: pickAvatarClass(s.name),
}));

export const STAFF_STATS: StaffStats = {
  total: 7,
  onDuty: 7,
  doctors: 3,
  therapists: 3,
  support: 1,
};

