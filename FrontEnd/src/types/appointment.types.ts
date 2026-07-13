export type AppointmentType =
  | 'General Consult'
  | 'Panchakarma'
  | 'Follow-up'
  | 'Diet Consult'
  | 'Shodhana';

export type AppointmentStatus = 'Soon' | 'In' | 'Done' | 'Cancelled';

export type CalendarDotType = 'upcoming' | 'checked-in' | 'panchakarma';

export interface AppointmentDoctor {
  staffCode: string;
  id: string;
  name: string;
  title: string;
  role: string;
  consultationFee?: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  initials: string;
  avatarClass: string;
  staffCode: string;
  doctorName: string;
  type: AppointmentType;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt?: string;
}

export interface AppointmentFormValues {
  patientId: string;
  staffCode: string;
  type: AppointmentType;
  date: string;
  time: string;
  notes: string;
}

export interface AppointmentStats {
  scheduledToday: number;
  completed: number;
  panchakarma: number;
  cancelled: number;
}

export interface DoctorAvailability {
  staffCode: string;
  date: string;
  bookedSlots: string[];
  availableSlots: string[];
}

export const APPOINTMENT_TYPE_OPTIONS: AppointmentType[] = [
  'General Consult',
  'Panchakarma',
  'Follow-up',
  'Diet Consult',
  'Shodhana',
];

export const TIME_SLOTS = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '11:45',
  '12:00',
  '12:30',
  '13:00',
  '13:15',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
];
