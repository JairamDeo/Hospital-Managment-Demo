export type TherapyType = 'Vamana' | 'Virechana' | 'Basti' | 'Nasya';

export type ProgramStatus = 'Ongoing' | 'Starting' | 'Complete' | 'Cancelled';

export type RoomStatus = 'Available' | 'Partial' | 'Full' | 'Occupied' | 'Cleaning';

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
  therapistId?: string;
  therapistName?: string;
  startDate?: string;
  hasDailyPlan?: boolean;
  needsAttend?: boolean;
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
  staffCode: string;
  name: string;
  specialty: string;
  patientCount: number;
  initials: string;
  avatarClass: string;
}

export interface TreatmentRoom {
  id: string;
  roomCode: string;
  name: string;
  roomNumber?: string;
  capacity?: number;
  occupied?: number;
  available?: number;
  therapy: string;
  status: RoomStatus;
}

export interface ScheduleProgramFormValues {
  patientId: string;
  therapy: TherapyType;
  totalDays: number;
  roomCode: string;
  therapistId: string;
  startDate: string;
  treatmentName?: string;
  totalFees?: string;
}

export interface ScheduleProgramDailySession {
  dayNumber: number;
  sessionDate: string;
  time: string;
  duration: string;
  panchakarmaType: string;
  medicineContent: string;
}

export interface ScheduleProgramPayload extends ScheduleProgramFormValues {
  dailySessions: ScheduleProgramDailySession[];
}

export interface ProgramAttendPayload {
  treatmentName: string;
  totalFees: number;
  dailySessions: ScheduleProgramDailySession[];
}

export interface PanchakarmaStats {
  activePrograms: number;
  therapistsOnDuty: number;
  roomsAvailable: number;
  therapySummaries: { therapy: TherapyType; activeSessions: number }[];
}

export const THERAPY_OPTIONS: TherapyType[] = ['Vamana', 'Virechana', 'Basti', 'Nasya'];

export const PROGRAM_DAY_OPTIONS = [7, 8, 10, 14, 21];

export const THERAPY_SUMMARY_META: Record<
  TherapyType,
  { subtitle: string; accent: string; iconBg: string; barColor: string }
> = {
  Vamana: {
    subtitle: 'Emesis Therapy',
    accent: 'text-violet-600',
    iconBg: 'bg-violet-100 text-violet-600',
    barColor: 'bg-violet-500',
  },
  Virechana: {
    subtitle: 'Purgation Therapy',
    accent: 'text-warning',
    iconBg: 'bg-warning-bg text-warning',
    barColor: 'bg-warning',
  },
  Basti: {
    subtitle: 'Enema Therapy',
    accent: 'text-success',
    iconBg: 'bg-success-bg text-success',
    barColor: 'bg-success',
  },
  Nasya: {
    subtitle: 'Nasal Therapy',
    accent: 'text-pink-600',
    iconBg: 'bg-pink-100 text-pink-600',
    barColor: 'bg-pink-500',
  },
};

export const THERAPY_STYLES: Record<TherapyType, { badge: string; dot: string }> = {
  Vamana: { badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  Virechana: { badge: 'bg-warning-bg text-warning', dot: 'bg-warning' },
  Basti: { badge: 'bg-success-bg text-success', dot: 'bg-success' },
  Nasya: { badge: 'bg-pink-100 text-pink-700', dot: 'bg-pink-500' },
};
