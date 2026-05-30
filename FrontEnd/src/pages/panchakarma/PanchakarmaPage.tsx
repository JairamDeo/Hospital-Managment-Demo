import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ScheduleProgramModal } from '@/components/modals/ScheduleProgramModal';
import { TherapySummaryCard } from '@/components/panchakarma/TherapySummaryCard';
import { ActiveProgramsTable } from '@/components/panchakarma/ActiveProgramsTable';
import { TherapistsPanel } from '@/components/panchakarma/TherapistsPanel';
import { TreatmentRoomsPanel } from '@/components/panchakarma/TreatmentRoomsPanel';
import { useToast } from '@/hooks/useToast';
import { MOCK_PATIENTS } from '@/pages/patients/data/mockPatients';
import {
  MOCK_ACTIVE_PROGRAMS,
  MOCK_ROOMS,
  MOCK_THERAPISTS,
  PANCHAKARMA_STATS,
  THERAPY_SUMMARIES,
  emptyScheduleProgramForm,
  type ActiveProgram,
  type ScheduleProgramFormValues,
} from './data/mockPanchakarma';

export const PanchakarmaPage = () => {
  const [programs, setPrograms] = useState<ActiveProgram[]>(MOCK_ACTIVE_PROGRAMS);
  const [modalOpen, setModalOpen] = useState(false);
  const [formInitial, setFormInitial] = useState(emptyScheduleProgramForm());
  const { showToast } = useToast();

  const openSchedule = () => {
    setFormInitial(emptyScheduleProgramForm());
    setModalOpen(true);
  };

  const handleCreate = (values: ScheduleProgramFormValues) => {
    const patient = MOCK_PATIENTS.find((p) => p.id === values.patientId);
    if (!patient) return;

    const newProgram: ActiveProgram = {
      id: `PK-${String(programs.length + 1).padStart(3, '0')}`,
      patientId: patient.id,
      patientName: patient.name,
      initials: patient.initials,
      avatarClass: patient.avatarClass,
      therapy: values.therapy,
      currentDay: 1,
      totalDays: values.totalDays,
      room: values.room,
      progress: Math.round((1 / values.totalDays) * 100),
      status: 'Starting',
    };

    setPrograms((prev) => [newProgram, ...prev]);
    setModalOpen(false);
    showToast(`Program scheduled for ${patient.name}`, 'success');
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-3 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-sage-deep sm:text-[1.75rem]">
            Panchakarma Scheduling
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {PANCHAKARMA_STATS.activePrograms} active programs ·{' '}
            {PANCHAKARMA_STATS.therapistsOnDuty} therapists on duty ·{' '}
            {PANCHAKARMA_STATS.roomsAvailable} rooms available
          </p>
        </div>
        <Button className="gap-2 rounded-lg px-4 py-2" onClick={openSchedule}>
          <Plus className="h-4 w-4" strokeWidth={2} />
          Schedule Program
        </Button>
      </div>

      <div className="mb-3 grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
        {THERAPY_SUMMARIES.map((s) => (
          <TherapySummaryCard key={s.therapy} summary={s} />
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[1fr_280px]">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border-sage bg-white shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b border-border-sage px-4 py-2.5">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
              Active Programs
            </h3>
            <button
              type="button"
              className="cursor-pointer text-xs font-semibold text-sage-deep hover:underline"
            >
              View All
            </button>
          </div>
          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
            <ActiveProgramsTable programs={programs} />
          </div>
        </div>

        <aside className="flex min-h-0 flex-col gap-3 overflow-hidden">
          <TherapistsPanel therapists={MOCK_THERAPISTS} />
          <TreatmentRoomsPanel rooms={MOCK_ROOMS} className="min-h-0 flex-1" />
        </aside>
      </div>

      <ScheduleProgramModal
        key={modalOpen ? 'open' : 'closed'}
        open={modalOpen}
        initial={formInitial}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
};

export default PanchakarmaPage;
