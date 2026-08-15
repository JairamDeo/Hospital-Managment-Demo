import type { HmsPanchakarmaProgram } from '@/types/api.types';
import type {
  ActiveProgram,
  PanchakarmaStats,
  ScheduleProgramFormValues,
  TherapistOnDuty,
  TherapySummary,
} from '@/types/panchakarma.types';
import { THERAPY_SUMMARY_META, THERAPY_OPTIONS } from '@/types/panchakarma.types';
import { getInitials, pickAvatarClass } from '@/utils/staffHelpers';
import type { StaffAssignment } from '@/pages/staff/data/mockStaffDetails';

export const emptyScheduleProgramForm = (): ScheduleProgramFormValues => ({
  patientId: '',
  therapy: 'Vamana',
  totalDays: 7,
  roomCode: '',
  therapistId: '',
  startDate: new Date().toISOString().slice(0, 10),
});

export const hmsToActiveProgram = (p: HmsPanchakarmaProgram): ActiveProgram => ({
  id: p.programCode ?? p.id,
  patientId: p.patientCode ?? p.patientId,
  patientName: p.patientName,
  initials: p.initials ?? getInitials(p.patientName),
  avatarClass: p.avatarClass ?? pickAvatarClass(p.patientName),
  therapy: p.therapy as ActiveProgram['therapy'],
  currentDay: p.currentDay,
  totalDays: p.totalDays,
  room: p.room,
  progress: p.progress,
  status: p.status as ActiveProgram['status'],
  therapistId: p.staffCode ?? p.therapistId,
  therapistName: p.therapistName,
  startDate: p.startDate,
  hasDailyPlan: (p.dailySessions?.length ?? 0) > 0,
  needsAttend: p.needsAttend ?? programNeedsAttend(p),
});

export const normalizeStaffCode = (code?: string | null) =>
  (code ?? '').trim().toUpperCase();

export const isTherapistAssignedToProgram = (
  program: { staffCode?: string; therapistId?: string },
  therapistStaffCode?: string
) => {
  if (!therapistStaffCode) return false;
  const assigned = program.staffCode ?? program.therapistId;
  return normalizeStaffCode(assigned) === normalizeStaffCode(therapistStaffCode);
};

export const programNeedsAttend = (program: {
  dailySessions?: unknown[] | null;
  status?: string;
  needsAttend?: boolean;
}) => {
  if (program.needsAttend != null) return program.needsAttend;
  return (
    (program.dailySessions?.length ?? 0) === 0 &&
    (program.status === 'Starting' || program.status === 'Ongoing')
  );
};

export const programsToStaffAssignments = (
  programs: HmsPanchakarmaProgram[]
): StaffAssignment[] =>
  programs.map((p) => ({
    id: p.programCode ?? p.id,
    patientName: p.patientName,
    patientId: p.patientCode ?? p.patientId,
    program: `Panchakarma — ${p.therapy} · ${p.room}`,
    since: p.startDateDisplay ?? p.startDate,
    status: p.status === 'Complete' ? 'Completed' : 'Active',
  }));

export const buildTherapySummaries = (
  stats: PanchakarmaStats | null
): TherapySummary[] =>
  THERAPY_OPTIONS.map((therapy) => {
    const meta = THERAPY_SUMMARY_META[therapy];
    const activeSessions =
      stats?.therapySummaries.find((s) => s.therapy === therapy)?.activeSessions ?? 0;
    return { therapy, activeSessions, ...meta };
  });

export const mapTherapistsFromApi = (
  therapists: Array<{
    staffCode: string;
    id: string;
    name: string;
    specialty: string;
    patientCount: number;
  }>
): TherapistOnDuty[] =>
  therapists.map((t) => ({
    id: t.staffCode ?? t.id,
    staffCode: t.staffCode ?? t.id,
    name: t.name,
    specialty: t.specialty,
    patientCount: t.patientCount,
    initials: getInitials(t.name),
    avatarClass: pickAvatarClass(t.name),
  }));
