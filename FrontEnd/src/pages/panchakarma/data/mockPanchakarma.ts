export type TherapyType = 'Vamana' | 'Virechana' | 'Basti' | 'Nasya';

export type ProgramStatus = 'Ongoing' | 'Starting' | 'Complete';

export type RoomStatus = 'Occupied' | 'Available' | 'Cleaning';

export interface ActiveProgram {
  id: string;
  patientId: string;
  patientName: string;
  initials: string;
  avatarClass: string;
  therapy: TherapyType;
  currentDay: number;
  totalDays: number;
  room: string;
  progress: number;
  status: ProgramStatus;
}

export interface TherapySummary {
  therapy: TherapyType;
  subtitle: string;
  activeSessions: number;
  accent: string;
  iconBg: string;
  barColor: string;
}

export interface TherapistOnDuty {
  id: string;
  name: string;
  specialty: string;
  patientCount: number;
  initials: string;
  avatarClass: string;
}

export interface TreatmentRoom {
  id: string;
  name: string;
  therapy: TherapyType;
  status: RoomStatus;
}

export interface ScheduleProgramFormValues {
  patientId: string;
  therapy: TherapyType;
  totalDays: number;
  room: string;
  therapistId: string;
  startDate: string;
}

export const PANCHAKARMA_STATS = {
  activePrograms: 5,
  therapistsOnDuty: 3,
  roomsAvailable: 4,
};

export const THERAPY_OPTIONS: TherapyType[] = ['Vamana', 'Virechana', 'Basti', 'Nasya'];

export const THERAPY_SUMMARIES: TherapySummary[] = [
  {
    therapy: 'Vamana',
    subtitle: 'Emesis Therapy',
    activeSessions: 4,
    accent: 'text-violet-600',
    iconBg: 'bg-violet-100 text-violet-600',
    barColor: 'bg-violet-500',
  },
  {
    therapy: 'Virechana',
    subtitle: 'Purgation Therapy',
    activeSessions: 6,
    accent: 'text-warning',
    iconBg: 'bg-warning-bg text-warning',
    barColor: 'bg-warning',
  },
  {
    therapy: 'Basti',
    subtitle: 'Enema Therapy',
    activeSessions: 3,
    accent: 'text-success',
    iconBg: 'bg-success-bg text-success',
    barColor: 'bg-success',
  },
  {
    therapy: 'Nasya',
    subtitle: 'Nasal Therapy',
    activeSessions: 5,
    accent: 'text-pink-600',
    iconBg: 'bg-pink-100 text-pink-600',
    barColor: 'bg-pink-500',
  },
];

export const THERAPY_STYLES: Record<
  TherapyType,
  { badge: string; dot: string }
> = {
  Vamana: { badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  Virechana: { badge: 'bg-warning-bg text-warning', dot: 'bg-warning' },
  Basti: { badge: 'bg-success-bg text-success', dot: 'bg-success' },
  Nasya: { badge: 'bg-pink-100 text-pink-700', dot: 'bg-pink-500' },
};

export const MOCK_ACTIVE_PROGRAMS: ActiveProgram[] = [
  {
    id: 'PK-001',
    patientId: 'AH-10018',
    patientName: 'Priya Sharma',
    initials: 'PS',
    avatarClass: 'bg-pink-100 text-pink-700',
    therapy: 'Vamana',
    currentDay: 3,
    totalDays: 7,
    room: 'Room 1',
    progress: 43,
    status: 'Ongoing',
  },
  {
    id: 'PK-002',
    patientId: 'AH-10031',
    patientName: 'Vijay Kumar',
    initials: 'VK',
    avatarClass: 'bg-emerald-100 text-emerald-800',
    therapy: 'Virechana',
    currentDay: 5,
    totalDays: 10,
    room: 'Room 2',
    progress: 50,
    status: 'Ongoing',
  },
  {
    id: 'PK-003',
    patientId: 'AH-10062',
    patientName: 'Meera Kapoor',
    initials: 'MK',
    avatarClass: 'bg-violet-100 text-violet-700',
    therapy: 'Nasya',
    currentDay: 1,
    totalDays: 14,
    room: 'Room 3',
    progress: 7,
    status: 'Starting',
  },
  {
    id: 'PK-004',
    patientId: 'AH-10024',
    patientName: 'Rahul Singh',
    initials: 'RS',
    avatarClass: 'bg-blue-100 text-blue-700',
    therapy: 'Basti',
    currentDay: 8,
    totalDays: 8,
    room: 'Room 4',
    progress: 100,
    status: 'Complete',
  },
  {
    id: 'PK-005',
    patientId: 'AH-10071',
    patientName: 'Anita Roy',
    initials: 'AR',
    avatarClass: 'bg-amber-100 text-amber-800',
    therapy: 'Virechana',
    currentDay: 2,
    totalDays: 10,
    room: 'Room 1',
    progress: 20,
    status: 'Ongoing',
  },
];

export const MOCK_THERAPISTS: TherapistOnDuty[] = [
  {
    id: 'TH-01',
    name: 'Dr. Rekha Nair',
    specialty: 'Vamana Specialist',
    patientCount: 3,
    initials: 'RN',
    avatarClass: 'bg-violet-100 text-violet-700',
  },
  {
    id: 'TH-02',
    name: 'Dr. Sanjay Mehta',
    specialty: 'Basti Specialist',
    patientCount: 2,
    initials: 'SM',
    avatarClass: 'bg-success-bg text-success',
  },
  {
    id: 'TH-03',
    name: 'Dr. Kavita Rao',
    specialty: 'Nasya Specialist',
    patientCount: 2,
    initials: 'KR',
    avatarClass: 'bg-pink-100 text-pink-600',
  },
];

export const MOCK_ROOMS: TreatmentRoom[] = [
  { id: 'R1', name: 'Room 1', therapy: 'Vamana', status: 'Occupied' },
  { id: 'R2', name: 'Room 2', therapy: 'Virechana', status: 'Occupied' },
  { id: 'R3', name: 'Room 3', therapy: 'Nasya', status: 'Available' },
  { id: 'R4', name: 'Room 4', therapy: 'Basti', status: 'Cleaning' },
];

export const ROOM_OPTIONS = ['Room 1', 'Room 2', 'Room 3', 'Room 4'];

export const PROGRAM_DAY_OPTIONS = [7, 8, 10, 14, 21];

export const emptyScheduleProgramForm = (): ScheduleProgramFormValues => ({
  patientId: '',
  therapy: 'Vamana',
  totalDays: 7,
  room: 'Room 1',
  therapistId: '',
  startDate: new Date().toISOString().slice(0, 10),
});
