export type StaffRole = 'Doctor' | 'Therapist' | 'Support' | 'Lab';

export type StaffFilter = 'all' | 'doctor' | 'therapist' | 'support';

export type DutyStatus = 'On Duty' | 'Off Duty';

export type QualificationLevel =
  | 'UG'
  | 'PG'
  | 'Doctorate'
  | 'Diploma'
  | 'Certificate'
  | 'Other';

export interface StaffQualification {
  level: QualificationLevel;
  degree: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  title: string;
  initials: string;
  avatarClass: string;
  status: DutyStatus;
  statPrimary: { value: number; label: string };
  today: number;
  todayLabel: string;
  rating: number;
  tags: string[];
  shift: string;
}

export interface StaffStats {
  total: number;
  onDuty: number;
  doctors: number;
  therapists: number;
  support: number;
}

export interface StaffFormValues {
  name: string;
  role: StaffRole;
  title: string;
  shift: string;
  registrationNumber: string;
  aadharNumber: string;
  panNumber: string;
  qualifications: StaffQualification[];
}

export const ROLE_OPTIONS: StaffRole[] = ['Doctor', 'Therapist', 'Support', 'Lab'];

export const QUALIFICATION_LEVEL_OPTIONS: QualificationLevel[] = [
  'UG',
  'PG',
  'Doctorate',
  'Diploma',
  'Certificate',
  'Other',
];
