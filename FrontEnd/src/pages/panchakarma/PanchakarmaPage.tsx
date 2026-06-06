import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ScheduleProgramModal } from '@/components/modals/ScheduleProgramModal';
import { TherapySummaryCard } from '@/components/panchakarma/TherapySummaryCard';
import { ActiveProgramsTable } from '@/components/panchakarma/ActiveProgramsTable';
import { TherapistsPanel } from '@/components/panchakarma/TherapistsPanel';
import { TreatmentRoomsPanel } from '@/components/panchakarma/TreatmentRoomsPanel';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { useAdminPatientsList } from '@/hooks/useAdminPatientsList';
import { panchakarmaAdminService } from '@/services/panchakarma/panchakarmaAdmin.service';
import { getApiErrorMessage } from '@/utils/helpers';
import {
  buildTherapySummaries,
  emptyScheduleProgramForm,
  hmsToActiveProgram,
  mapTherapistsFromApi,
} from '@/utils/panchakarmaHelpers';
import type {
  ActiveProgram,
  PanchakarmaStats,
  ScheduleProgramFormValues,
  TherapistOnDuty,
  TreatmentRoom,
} from '@/types/panchakarma.types';

const defaultStats = (): PanchakarmaStats => ({
  activePrograms: 0,
  therapistsOnDuty: 0,
  roomsAvailable: 4,
  therapySummaries: [],
});

export const PanchakarmaPage = () => {
  const [programs, setPrograms] = useState<ActiveProgram[]>([]);
  const [stats, setStats] = useState<PanchakarmaStats>(defaultStats());
  const [therapists, setTherapists] = useState<TherapistOnDuty[]>([]);
  const [rooms, setRooms] = useState<TreatmentRoom[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleInitial, setScheduleInitial] = useState(emptyScheduleProgramForm());
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();
  const { canEdit, staffRole, staffCode } = usePermissions();
  const { patients } = useAdminPatientsList();

  const isTherapist = staffRole === 'Therapist' && Boolean(staffCode);
  const canCreateProgram = !isTherapist && canEdit('panchakarma');

  const lockedTherapist = useMemo((): TherapistOnDuty | null => {
    if (!isTherapist || !staffCode) return null;
    const fromList = therapists.find((t) => t.id === staffCode);
    if (fromList) return fromList;
    return {
      id: staffCode,
      staffCode,
      name: user?.name ?? 'You',
      specialty: user?.title ?? 'Therapist',
      patientCount: 0,
      initials: (user?.name ?? 'YO').slice(0, 2).toUpperCase(),
      avatarClass: 'bg-emerald-100 text-emerald-800',
    };
  }, [isTherapist, staffCode, therapists, user]);

  const therapySummaries = useMemo(() => buildTherapySummaries(stats), [stats]);

  const loadData = useCallback(async () => {
    setListLoading(true);
    try {
      const [programsRes, statsRes, therapistsRes, roomsRes] = await Promise.all([
        panchakarmaAdminService.listPrograms(),
        panchakarmaAdminService.getStats(),
        panchakarmaAdminService.listTherapists(),
        panchakarmaAdminService.listRooms(),
      ]);
      setPrograms((programsRes.data.res?.programs ?? []).map(hmsToActiveProgram));
      setStats(statsRes.data.res?.stats ?? defaultStats());
      setTherapists(mapTherapistsFromApi(therapistsRes.data.res?.therapists ?? []));
      setRooms(roomsRes.data.res?.rooms ?? []);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setListLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openScheduleModal = () => {
    setScheduleInitial(emptyScheduleProgramForm());
    setScheduleOpen(true);
  };

  const handleCreate = async (values: ScheduleProgramFormValues) => {
    setSubmitting(true);
    try {
      const { data } = await panchakarmaAdminService.create(values);
      if (data.status_code === 201) {
        showToast('Panchakarma program scheduled', 'success');
        setScheduleOpen(false);
        await loadData();
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-3 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-sage-deep sm:text-[1.75rem]">
            {lockedTherapist ? 'My Panchakarma Programs' : 'Panchakarma Scheduling'}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {stats.activePrograms} active program{stats.activePrograms === 1 ? '' : 's'}
            {lockedTherapist
              ? ` · ${lockedTherapist.name}`
              : ` · ${stats.therapistsOnDuty} therapists on duty · ${stats.roomsAvailable} rooms available`}
          </p>
        </div>
        {canCreateProgram ? (
          <Button className="gap-2 rounded-lg px-4 py-2" onClick={openScheduleModal}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Schedule Program
          </Button>
        ) : null}
      </div>

      <div className="mb-3 grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
        {therapySummaries.map((s) => (
          <TherapySummaryCard key={s.therapy} summary={s} />
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[1fr_280px]">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border-sage bg-white shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b border-border-sage px-4 py-2.5">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
              {lockedTherapist ? 'My Active Programs' : 'Active Programs'}
            </h3>
          </div>
          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
            {listLoading ? (
              <p className="py-12 text-center text-sm text-ink-soft">Loading programs…</p>
            ) : (
              <ActiveProgramsTable programs={programs} />
            )}
          </div>
        </div>

        <aside className="flex min-h-0 flex-col gap-3 overflow-hidden">
          {!lockedTherapist ? <TherapistsPanel therapists={therapists} /> : null}
          <TreatmentRoomsPanel rooms={rooms} className="min-h-0 flex-1" />
        </aside>
      </div>

      <ScheduleProgramModal
        open={scheduleOpen}
        initial={scheduleInitial}
        patients={patients}
        therapists={therapists}
        rooms={rooms}
        submitting={submitting}
        onClose={() => setScheduleOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
};

export default PanchakarmaPage;
