import type { Appointment, AppointmentType } from '@/types/appointment.types';

export interface AppointmentVitals {
  bp: string;
  pulse: string;
  temp: string;
  spo2: string;
  weight?: string;
}

export interface AppointmentActivity {
  id: string;
  title: string;
  date: string;
  description: string;
  actor: string;
}

export interface AppointmentDocument {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  size: string;
}

export interface AppointmentClinicalNote {
  label: string;
  value: string;
}

export type AppointmentDetailTab = 'overview' | 'vitals' | 'notes' | 'activity' | 'documents';

export interface AppointmentDetail extends Appointment {
  formattedDate: string;
  formattedTime: string;
  duration: string;
  doctor: string;
  doctorId: string;
  room: string;
  department: string;
  chiefComplaint: string;
  symptoms: string[];
  diagnosis?: string;
  treatmentPlan?: string;
  patientPhone: string;
  patientAge: string;
  patientPrakriti?: string;
  checkInTime?: string;
  fee?: number;
  paymentStatus?: 'Paid' | 'Pending' | 'Waived';
  vitals?: AppointmentVitals;
  clinicalNotes: AppointmentClinicalNote[];
  doctorNotes?: string;
  followUp?: string;
  prepInstructions?: string[];
  activityLog: AppointmentActivity[];
  documents: AppointmentDocument[];
}

export type { AppointmentType };
