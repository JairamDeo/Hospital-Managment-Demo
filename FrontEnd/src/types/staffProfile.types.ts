export type StaffActivityType =
  | 'check_in'
  | 'check_out'
  | 'leave_applied'
  | 'leave_approved'
  | 'leave_rejected';

export interface StaffActivityRecord {
  id: string;
  activityType?: StaffActivityType;
  title: string;
  dateRange: string;
  status: 'Active' | 'Completed';
  description: string;
  tags: string[];
  createdAt?: string;
}

export interface StaffDocumentRecord {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  size: string;
  downloadUrl?: string;
}

export interface StaffLeaveRecord {
  id: string;
  leaveCode?: string;
  type: string;
  from: string;
  to: string;
  days: number;
  leaveDates?: string[];
  status: 'Approved' | 'Pending' | 'Rejected';
  staffCode?: string;
  staffName?: string;
}

export type StaffDetailTab = 'activity' | 'assignments' | 'documents' | 'leave';

export interface StaffProfileCardData {
  id: string;
  name: string;
  role: 'Doctor' | 'Therapist' | 'Support' | 'Lab';
  title: string;
  status: 'On Duty' | 'Off Duty';
  initials: string;
  avatarClass: string;
  email: string;
  phone: string;
  department: string;
  joinedDate: string;
  experience: string;
  shift: string;
  tags: string[];
  consultationFee?: number;
  netMonthly?: number;
  grossMonthly?: number;
  qualifications?: { level: string; degree: string }[];
  registrationNumber?: string;
  aadharNumber?: string;
  panNumber?: string;
}
