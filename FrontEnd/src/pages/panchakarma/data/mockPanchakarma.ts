/** @deprecated Data comes from API. Types moved to @/types/panchakarma.types */
export type {
  TherapyType,
  ProgramStatus,
  RoomStatus,
  ActiveProgram,
  TherapySummary,
  TherapistOnDuty,
  TreatmentRoom,
  ScheduleProgramFormValues,
  PanchakarmaStats,
} from '@/types/panchakarma.types';

export {
  THERAPY_OPTIONS,
  ROOM_OPTIONS,
  PROGRAM_DAY_OPTIONS,
  THERAPY_STYLES,
  THERAPY_SUMMARY_META,
} from '@/types/panchakarma.types';

export { emptyScheduleProgramForm } from '@/utils/panchakarmaHelpers';

export const PANCHAKARMA_STATS = {
  activePrograms: 0,
  therapistsOnDuty: 0,
  roomsAvailable: 4,
};

export const THERAPY_SUMMARIES: import('@/types/panchakarma.types').TherapySummary[] = [];
export const MOCK_ACTIVE_PROGRAMS: import('@/types/panchakarma.types').ActiveProgram[] = [];
export const MOCK_THERAPISTS: import('@/types/panchakarma.types').TherapistOnDuty[] = [];
export const MOCK_ROOMS: import('@/types/panchakarma.types').TreatmentRoom[] = [];
