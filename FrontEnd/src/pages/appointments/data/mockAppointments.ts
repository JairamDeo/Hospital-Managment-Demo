export type AppointmentType =
  | 'General Consult'
  | 'Panchakarma'
  | 'Follow-up'
  | 'Diet Consult'
  | 'Shodhana';

export type AppointmentStatus = 'Soon' | 'In' | 'Done' | 'Cancelled';

export type CalendarDotType = 'upcoming' | 'checked-in' | 'panchakarma';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  initials: string;
  avatarClass: string;
  type: AppointmentType;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
}

export interface AppointmentFormValues {
  patientId: string;
  type: AppointmentType;
  date: string;
  time: string;
  notes: string;
}

export const APPOINTMENT_STATS = {
  scheduledToday: 22,
  completed: 8,
  panchakarma: 5,
  cancelled: 3,
};

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

/** Map day-of-month → dot types for October 2023 calendar */
export const CALENDAR_DOTS: Record<number, CalendarDotType[]> = {
  2: ['upcoming'],
  5: ['upcoming', 'panchakarma'],
  8: ['checked-in'],
  12: ['upcoming', 'checked-in'],
  15: ['panchakarma'],
  18: ['upcoming'],
  20: ['checked-in', 'panchakarma'],
  23: ['upcoming'],
  24: ['upcoming', 'checked-in'],
  26: ['upcoming', 'checked-in', 'panchakarma'],
  28: ['upcoming'],
  30: ['panchakarma'],
};

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'APT-001',
    patientId: 'AH-10024',
    patientName: 'Rahul Singh',
    initials: 'RS',
    avatarClass: 'bg-blue-100 text-blue-700',
    type: 'General Consult',
    date: '2023-10-26',
    time: '10:30',
    status: 'Soon',
  },
  {
    id: 'APT-002',
    patientId: 'AH-10018',
    patientName: 'Priya Sharma',
    initials: 'PS',
    avatarClass: 'bg-pink-100 text-pink-700',
    type: 'Panchakarma',
    date: '2023-10-26',
    time: '11:00',
    status: 'In',
  },
  {
    id: 'APT-003',
    patientId: 'AH-10031',
    patientName: 'Vijay Kumar',
    initials: 'VK',
    avatarClass: 'bg-emerald-100 text-emerald-800',
    type: 'Follow-up',
    date: '2023-10-26',
    time: '11:45',
    status: 'Soon',
  },
  {
    id: 'APT-004',
    patientId: 'AH-10009',
    patientName: 'Ananya Desai',
    initials: 'AD',
    avatarClass: 'bg-violet-100 text-violet-700',
    type: 'Diet Consult',
    date: '2023-10-26',
    time: '12:30',
    status: 'Soon',
  },
  {
    id: 'APT-005',
    patientId: 'AH-10055',
    patientName: 'Meera Joshi',
    initials: 'MJ',
    avatarClass: 'bg-amber-100 text-amber-800',
    type: 'Panchakarma',
    date: '2023-10-26',
    time: '13:15',
    status: 'Soon',
  },
];

export const emptyAppointmentForm = (): AppointmentFormValues => ({
  patientId: '',
  type: 'General Consult',
  date: '2023-10-26',
  time: '10:30',
  notes: '',
});
