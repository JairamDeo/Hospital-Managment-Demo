import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, ClipboardList, Eye, Plus, Sparkles } from 'lucide-react';
import { ContentLoader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { ScheduleProgramModal } from '@/components/modals/ScheduleProgramModal';
import { AnimatedProgressBar } from '@/components/panchakarma/AnimatedProgressBar';
import { ProgramStatusBadge } from '@/components/panchakarma/ProgramStatusBadge';
import { programAttendPath } from '@/constants/routes';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/useToast';
import { panchakarmaAdminService } from '@/services/panchakarma/panchakarmaAdmin.service';
import { getApiErrorMessage } from '@/utils/helpers';
import {
  emptyScheduleProgramForm,
  isTherapistAssignedToProgram,
  mapTherapistsFromApi,
  programNeedsAttend,
} from '@/utils/panchakarmaHelpers';
import type { HmsPanchakarmaProgram } from '@/types/api.types';
import type {
  ProgramStatus,
  ScheduleProgramFormValues,
  TherapistOnDuty,
} from '@/types/panchakarma.types';
interface Props {
  patientCode: string;
  patientName?: string;
  programs: HmsPanchakarmaProgram[];
  loading?: boolean;
  onRefresh?: () => void | Promise<void>;
}

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

const isPreviousProgram = (status?: string) =>
  status === 'Complete' || status === 'Cancelled';

export const PatientPanchakarmaTab = ({
  patientCode,
  patientName = '',
  programs,
  loading = false,
  onRefresh,
}: Props) => {
  const { showToast } = useToast();
  const { staffRole, staffCode, canView, canEdit, isAdmin } = usePermissions();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [therapists, setTherapists] = useState<TherapistOnDuty[]>([]);

  const isTherapist = staffRole === 'Therapist' && Boolean(staffCode);
  const isDoctor = staffRole === 'Doctor';
  const canSchedule =
    isAdmin || (isDoctor && canEdit('panchakarma')) || (!isTherapist && canEdit('panchakarma'));
  const canScheduleDetails = canSchedule;

  const patientOption = useMemo(
    () =>
      patientCode
        ? [{ id: patientCode, name: patientName || patientCode }]
        : [],
    [patientCode, patientName]
  );

  const scheduleInitial = useMemo(
    (): ScheduleProgramFormValues => ({
      ...emptyScheduleProgramForm(),
      patientId: patientCode,
    }),
    [patientCode]
  );

  const { activePrograms, previousPrograms } = useMemo(() => {
    const active: HmsPanchakarmaProgram[] = [];
    const previous: HmsPanchakarmaProgram[] = [];
    for (const p of programs) {
      if (isPreviousProgram(p.status)) previous.push(p);
      else active.push(p);
    }
    return { activePrograms: active, previousPrograms: previous };
  }, [programs]);

  useEffect(() => {
    if (!canSchedule) return;
    panchakarmaAdminService
      .listTherapists()
      .then((res) => {
        setTherapists(mapTherapistsFromApi(res.data.res?.therapists ?? []));
      })
      .catch(() => setTherapists([]));
  }, [canSchedule]);

  const actionFor = (program: HmsPanchakarmaProgram) => {
    const id = program.programCode || program.id;
    const needsPlan = programNeedsAttend(program);
    const isDone = isPreviousProgram(program.status);
    if (canScheduleDetails && !isDone) {
      return {
        to: programAttendPath(id),
        label: needsPlan ? 'Add details' : 'Edit plan',
        icon: ClipboardList,
      };
    }
    if (
      isTherapist &&
      canView('panchakarma') &&
      isTherapistAssignedToProgram(program, staffCode)
    ) {
      return { to: programAttendPath(id), label: 'View plan', icon: Eye };
    }
    if (canScheduleDetails && isDone) {
      return { to: programAttendPath(id), label: 'View', icon: Eye };
    }
    return null;
  };

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = useCallback(
    async (values: ScheduleProgramFormValues) => {
      setSubmitting(true);
      try {
        const { data } = await panchakarmaAdminService.create({
          ...values,
          patientId: patientCode,
        });
        if (data.status_code === 201) {
          showToast('Panchakarma program scheduled', 'success');
          setScheduleOpen(false);
          await onRefresh?.();
        }
      } catch (err) {
        showToast(getApiErrorMessage(err), 'error');
      } finally {
        setSubmitting(false);
      }
    },
    [onRefresh, patientCode, showToast]
  );

  const renderProgramCard = (program: HmsPanchakarmaProgram) => {
    const id = program.programCode || program.id;
    const isOpen = expanded.has(id);
    const hasSessions = (program.dailySessions?.length ?? 0) > 0;
    const title =
      program.treatmentName?.trim() ||
      (hasSessions ? 'Panchakarma program' : 'Scheduled — details pending');
    const action = actionFor(program);
    const ActionIcon = action?.icon;
    const needsPlan = programNeedsAttend(program);
    const previous = isPreviousProgram(program.status);

    return (
      <div
        key={id}
        className={`overflow-hidden rounded-xl border border-border-sage bg-white shadow-sm ${
          previous ? 'opacity-95' : ''
        }`}
      >
        <div className="flex items-start gap-3 px-4 py-4">
          <button
            type="button"
            onClick={() => toggle(id)}
            className="mt-0.5 shrink-0 cursor-pointer text-ink-ghost hover:text-ink-soft"
            aria-label={isOpen ? 'Collapse program' : 'Expand program'}
          >
            {isOpen ? (
              <ChevronUp className="h-4 w-4" strokeWidth={2} />
            ) : (
              <ChevronDown className="h-4 w-4" strokeWidth={2} />
            )}
          </button>

          <button
            type="button"
            onClick={() => toggle(id)}
            className="min-w-0 flex-1 cursor-pointer text-left hover:opacity-90"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-ink">{title}</span>
              <ProgramStatusBadge status={program.status as ProgramStatus} />
            </div>
            <p className="mt-1 text-xs text-ink-ghost">
              {program.programCode}
              {program.startDateDisplay || program.startDate
                ? ` · Start ${program.startDateDisplay || formatDate(program.startDate)}`
                : ''}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
              <span>
                Therapist: <strong className="text-ink">{program.therapistName}</strong>
              </span>
              <span>
                Days: <strong className="text-ink">{program.totalDays}</strong>
              </span>
              {!previous ? (
                <span>
                  Day {program.currentDay}/{program.totalDays}
                </span>
              ) : null}
              {(program.totalFees ?? 0) > 0 ? (
                <span>
                  Fees: {formatCurrency(program.totalFees ?? 0)}
                  {(program.amountPaid ?? 0) > 0
                    ? ` · Paid ${formatCurrency(program.amountPaid ?? 0)}`
                    : ''}
                </span>
              ) : null}
            </div>
            {!previous ? (
              <div className="mt-3 max-w-xs">
                <AnimatedProgressBar progress={program.progress} />
              </div>
            ) : null}
          </button>

          {action && ActionIcon ? (
            <Link to={action.to} className="shrink-0 self-center">
              <Button type="button" className="gap-1.5 rounded-xl py-2 text-xs">
                <ActionIcon className="h-3.5 w-3.5" />
                {action.label}
              </Button>
            </Link>
          ) : null}
        </div>

        {isOpen ? (
          <div className="border-t border-border-sage bg-cream/20 px-4 py-4">
            {hasSessions ? (
              <>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                  Daily schedule
                </p>
                <div className="overflow-x-auto rounded-lg border border-border-sage bg-white">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border-sage bg-cream/50 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                        {['Day', 'Date', 'Time', 'Duration', 'Therapy', 'Medicine / notes'].map(
                          (col) => (
                            <th key={col} className="px-3 py-2">
                              {col}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {program.dailySessions!.map((session) => (
                        <tr
                          key={session.id}
                          className="border-b border-border-sage/60 last:border-0"
                        >
                          <td className="px-3 py-2 font-medium text-ink">{session.dayNumber}</td>
                          <td className="px-3 py-2 text-ink-soft">
                            {formatDate(session.sessionDate)}
                          </td>
                          <td className="px-3 py-2 text-ink-soft">{session.time || '—'}</td>
                          <td className="px-3 py-2 text-ink-soft">{session.duration || '—'}</td>
                          <td className="px-3 py-2 text-ink-soft">
                            {session.panchakarmaType || '—'}
                          </td>
                          <td className="px-3 py-2 text-ink-soft">
                            {session.medicineContent?.trim() || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-ink-soft">
                    No day-by-day schedule recorded for this program yet.
                  </p>
                  {needsPlan && canScheduleDetails ? (
                    <p className="mt-1 text-xs text-ink-ghost">
                      Add treatment and daily program details.
                    </p>
                  ) : null}
                  {needsPlan && isTherapist ? (
                    <p className="mt-1 text-xs text-ink-ghost">
                      Waiting for admin/doctor to set the daily plan and medicines.
                    </p>
                  ) : null}
                </div>
                {action && ActionIcon ? (
                  <Link to={action.to}>
                    <Button type="button" className="gap-1.5 rounded-xl py-2 text-xs">
                      <ActionIcon className="h-3.5 w-3.5" />
                      {action.label}
                    </Button>
                  </Link>
                ) : null}
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  };

  if (loading) {
    return <ContentLoader size="md" className="min-h-[200px]" />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
            Panchakarma programs
          </p>
          <p className="mt-0.5 text-sm text-ink-soft">
            {activePrograms.length} active · {previousPrograms.length} previous
          </p>
        </div>
        {canSchedule ? (
          <Button
            type="button"
            className="gap-1.5 rounded-xl px-3 py-2 text-xs"
            onClick={() => setScheduleOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Schedule program
          </Button>
        ) : null}
      </div>

      {programs.length === 0 ? (
        <div className="rounded-xl border border-border-sage bg-cream/20 px-4 py-12 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-ink-ghost" strokeWidth={1.5} />
          <p className="mt-2 text-sm font-medium text-ink-soft">No panchakarma programs yet</p>
          <p className="mt-1 text-xs text-ink-ghost">
            {canSchedule
              ? 'Schedule a program for this patient to get started'
              : 'Scheduled programs will appear here'}
          </p>
          {canSchedule ? (
            <Button
              type="button"
              className="mt-4 gap-1.5 rounded-xl px-3 py-2 text-xs"
              onClick={() => setScheduleOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Schedule program
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
              Active ({activePrograms.length})
            </p>
            {activePrograms.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border-sage px-3 py-4 text-sm text-ink-soft">
                No active programs
              </p>
            ) : (
              activePrograms.map(renderProgramCard)
            )}
          </section>

          <section className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
              Previous programs ({previousPrograms.length})
            </p>
            {previousPrograms.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border-sage px-3 py-4 text-sm text-ink-soft">
                No previous programs
              </p>
            ) : (
              previousPrograms.map(renderProgramCard)
            )}
          </section>
        </>
      )}

      <ScheduleProgramModal
        open={scheduleOpen}
        initial={scheduleInitial}
        patients={patientOption}
        therapists={therapists}
        submitting={submitting}
        onClose={() => setScheduleOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
};
