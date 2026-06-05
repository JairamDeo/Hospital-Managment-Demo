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
  { id: 'STF-002', name: 'Dr. Rekha Nair', role: 'Therapist', title: 'Vamana Specialist', status: 'On Duty', statPrimary: { value: 196, label: 'Patients' }, today: 8, rating: 4.8, tags: ['Vamana', 'Virechana'], shift: '9AM – 6PM' },
  { id: 'STF-003', name: 'Dr. Sanjay Mehta', role: 'Therapist', title: 'Basti Therapist', status: 'On Duty', statPrimary: { value: 148, label: 'Patients' }, today: 6, rating: 4.7, tags: ['Basti', 'Shodhana'], shift: '10AM – 6PM' },
  { id: 'STF-004', name: 'Dr. Kavita Rao', role: 'Therapist', title: 'Nasya Specialist', status: 'Off Duty', statPrimary: { value: 120, label: 'Patients' }, today: 0, rating: 4.6, tags: ['Nasya', 'Shirodhara'], shift: 'Off today' },
  { id: 'STF-005', name: 'Priya Desai', role: 'Pharmacist', title: 'Head Pharmacist', status: 'On Duty', statPrimary: { value: 248, label: 'Dispensed' }, today: 32, rating: 4.8, tags: ['Churna', 'Oil'], shift: '8AM – 4PM' },
  { id: 'STF-006', name: 'Amit Verma', role: 'Support', title: 'Reception Lead', status: 'On Duty', statPrimary: { value: 184, label: 'Handled' }, today: 24, rating: 4.9, tags: ['Front Desk', 'Billing'], shift: '8AM – 5PM' },
  { id: 'STF-007', name: 'Dr. Vijay Patel', role: 'Doctor', title: 'Senior Physician · IPD', status: 'On Duty', statPrimary: { value: 210, label: 'Patients' }, today: 9, rating: 4.7, tags: ['IPD', 'Follow-up'], shift: '9AM – 5PM' },
  { id: 'STF-008', name: 'Dr. Meera Joshi', role: 'Doctor', title: 'Diet & Lifestyle Consultant', status: 'On Duty', statPrimary: { value: 175, label: 'Patients' }, today: 7, rating: 4.8, tags: ['Diet', 'Prakriti'], shift: '10AM – 4PM' },
  { id: 'STF-009', name: 'Dr. Rahul Singh', role: 'Doctor', title: 'General Physician', status: 'Off Duty', statPrimary: { value: 162, label: 'Patients' }, today: 0, rating: 4.5, tags: ['OPD', 'Consult'], shift: 'Off today' },
  { id: 'STF-010', name: 'Dr. Anita Roy', role: 'Doctor', title: 'Panchakarma Physician', status: 'On Duty', statPrimary: { value: 198, label: 'Patients' }, today: 10, rating: 4.9, tags: ['Panchakarma', 'Detox'], shift: '9AM – 6PM' },
  { id: 'STF-011', name: 'Dr. Sunita Rao', role: 'Therapist', title: 'Shirodhara Specialist', status: 'On Duty', statPrimary: { value: 132, label: 'Patients' }, today: 5, rating: 4.7, tags: ['Shirodhara', 'Relaxation'], shift: '11AM – 7PM' },
  { id: 'STF-012', name: 'Dr. Arjun Kapoor', role: 'Therapist', title: 'Virechana Therapist', status: 'On Duty', statPrimary: { value: 115, label: 'Patients' }, today: 4, rating: 4.6, tags: ['Virechana', 'Purgation'], shift: '9AM – 5PM' },
  { id: 'STF-013', name: 'Neha Gupta', role: 'Pharmacist', title: 'Dispensing Pharmacist', status: 'On Duty', statPrimary: { value: 186, label: 'Dispensed' }, today: 28, rating: 4.7, tags: ['Tablets', 'Syrups'], shift: '9AM – 5PM' },
  { id: 'STF-014', name: 'Rohit Malhotra', role: 'Pharmacist', title: 'Inventory Pharmacist', status: 'On Duty', statPrimary: { value: 142, label: 'Dispensed' }, today: 18, rating: 4.6, tags: ['Stock', 'Orders'], shift: '8AM – 4PM' },
  { id: 'STF-015', name: 'Kavita Shah', role: 'Pharmacist', title: 'Herbal Formulations', status: 'Off Duty', statPrimary: { value: 98, label: 'Dispensed' }, today: 0, rating: 4.5, tags: ['Churna', 'Kashayam'], shift: 'Off today' },
  { id: 'STF-016', name: 'Suresh Iyer', role: 'Support', title: 'Billing Executive', status: 'On Duty', statPrimary: { value: 156, label: 'Handled' }, today: 20, rating: 4.8, tags: ['Billing', 'Insurance'], shift: '9AM – 5PM' },
  { id: 'STF-017', name: 'Pooja Nair', role: 'Support', title: 'Front Desk Associate', status: 'On Duty', statPrimary: { value: 142, label: 'Handled' }, today: 18, rating: 4.7, tags: ['Appointments', 'Enquiry'], shift: '8AM – 4PM' },
  { id: 'STF-018', name: 'Manish Kumar', role: 'Support', title: 'Ward Coordinator', status: 'On Duty', statPrimary: { value: 128, label: 'Handled' }, today: 15, rating: 4.6, tags: ['Ward', 'IPD'], shift: '10AM – 6PM' },
  { id: 'STF-019', name: 'Dr. Deepak Verma', role: 'Doctor', title: 'Ayurvedic Surgeon', status: 'On Duty', statPrimary: { value: 188, label: 'Patients' }, today: 8, rating: 4.8, tags: ['Surgery', 'Kshara'], shift: '9AM – 5PM' },
  { id: 'STF-020', name: 'Dr. Lakshmi Menon', role: 'Doctor', title: 'Pediatric Ayurveda', status: 'On Duty', statPrimary: { value: 145, label: 'Patients' }, today: 6, rating: 4.9, tags: ['Pediatric', 'Immunity'], shift: '10AM – 4PM' },
  { id: 'STF-021', name: 'Dr. Karan Desai', role: 'Therapist', title: 'Panchakarma Therapist', status: 'Off Duty', statPrimary: { value: 108, label: 'Patients' }, today: 0, rating: 4.5, tags: ['Panchakarma', 'Basti'], shift: 'Off today' },
  { id: 'STF-022', name: 'Ritu Sharma', role: 'Support', title: 'Patient Care Assistant', status: 'On Duty', statPrimary: { value: 112, label: 'Handled' }, today: 14, rating: 4.7, tags: ['Care', 'Support'], shift: '9AM – 5PM' },
  { id: 'STF-023', name: 'Dr. Harsh Patel', role: 'Doctor', title: 'Consulting Physician', status: 'On Duty', statPrimary: { value: 167, label: 'Patients' }, today: 7, rating: 4.6, tags: ['Consult', 'Diagnosis'], shift: '11AM – 7PM' },
  { id: 'STF-024', name: 'Geeta Reddy', role: 'Support', title: 'Records & Admin', status: 'Off Duty', statPrimary: { value: 96, label: 'Handled' }, today: 0, rating: 4.5, tags: ['Records', 'Admin'], shift: 'Off today' },
];

export const MOCK_STAFF: StaffMember[] = RAW_STAFF.map((s) => ({
  ...s,
  todayLabel: 'Today',
  initials: getInitials(s.name),
  avatarClass: pickAvatarClass(s.name),
}));

export const STAFF_STATS: StaffStats = {
  total: 24,
  onDuty: 18,
  doctors: 8,
  therapists: 6,
  pharmacists: 4,
  support: 6,
};
