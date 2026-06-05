import type { Patient } from '@/types/patient.types';

export interface PatientVitals {
  temp: string;
  bp: string;
  pulse: string;
  bmi: string;
}

export interface ActiveTreatment {
  program: string;
  stage: string;
  dayCurrent: number;
  dayTotal: number;
  percentComplete: number;
}

export type TreatmentRecordStatus = 'Active' | 'Completed';

export interface TreatmentRecord {
  id: string;
  title: string;
  doctor: string;
  status: TreatmentRecordStatus;
  dateRange: string;
  description: string;
  medicines: string[];
}

export interface PatientAppointment {
  id: string;
  appointmentCode?: string;
  date: string;
  time: string;
  type: string;
  doctor: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  followUpDate?: string | null;
  followUpDateIso?: string | null;
  followUpTime?: string | null;
  followUpTimeSlot?: string | null;
  hasFollowUp?: boolean;
  attendedAt?: string;
}

export interface LabReport {
  id: string;
  testName: string;
  date: string;
  result: string;
  status: 'Normal' | 'Abnormal' | 'Pending';
  lab: string;
}

export interface PatientInvoice {
  id: string;
  date: string;
  treatment: string;
  feeType?: 'Consultation' | 'Medicine' | '';
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export interface PatientDocument {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  size: string;
  url?: string;
}

export type PatientDetailTab =
  | 'patient-info'
  | 'history'
  | 'appointments'
  | 'prescriptions'
  | 'labs'
  | 'billing'
  | 'documents';

export interface PatientDetail extends Patient {
  gender: string;
  bloodGroup: string;
  memberSince: string;
  city: string;
  vitals: PatientVitals;
  activeTreatment?: ActiveTreatment;
  treatmentHistory: TreatmentRecord[];
  appointments: PatientAppointment[];
  labReports: LabReport[];
  invoices: PatientInvoice[];
  documents: PatientDocument[];
}

export const formatPatientRupee = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
