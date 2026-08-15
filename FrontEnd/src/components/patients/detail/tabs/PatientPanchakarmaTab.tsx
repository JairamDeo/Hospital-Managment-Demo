import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, ClipboardCheck, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AnimatedProgressBar } from '@/components/panchakarma/AnimatedProgressBar';
import { ProgramStatusBadge } from '@/components/panchakarma/ProgramStatusBadge';
import { TherapyBadge } from '@/components/panchakarma/TherapyBadge';
import { panchakarmaTreatmentPath, programAttendPath } from '@/constants/routes';
import { usePermissions } from '@/hooks/usePermissions';
import {
  isTherapistAssignedToProgram,
  programNeedsAttend,
} from '@/utils/panchakarmaHelpers';
import type { HmsPanchakarmaProgram } from '@/types/api.types';
import type { ProgramStatus } from '@/types/panchakarma.types';

interface Props {
  patientCode: string;
  programs: HmsPanchakarmaProgram[];
  loading?: boolean;
}

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    amount
  );

export const PatientPanchakarmaTab = ({ patientCode: _patientCode, programs, loading = false }: Props) => {
  const { staffRole, staffCode, canView } = usePermissions();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const isTherapist = staffRole === 'Therapist' && Boolean(staffCode);
  const canAttendPrograms = isTherapist && canView('panchakarma');

  const canShowAttend = (program: HmsPanchakarmaProgram) =>
    canAttendPrograms &&
    isTherapistAssignedToProgram(program, staffCode) &&
    programNeedsAttend(program);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-ink-soft">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading panchakarma programs…
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="rounded-xl border border-border-sage bg-cream/20 px-4 py-12 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-ink-ghost" strokeWidth={1.5} />
        <p className="mt-2 text-sm font-medium text-ink-soft">No panchakarma programs yet</p>
        <p className="mt-1 text-xs text-ink-ghost">
          Scheduled or completed therapy programs will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
        Programs ({programs.length})
      </p>

      {programs.map((program) => {
        const id = program.programCode || program.id;
        const isOpen = expanded.has(id);
        const hasSessions = (program.dailySessions?.length ?? 0) > 0;
        const title = program.treatmentName?.trim() || program.therapy;
        const showAttend = canShowAttend(program);
        const needsAttend = programNeedsAttend(program);
        const assignedToOther =
          canAttendPrograms &&
          needsAttend &&
          !isTherapistAssignedToProgram(program, staffCode);

        return (
          <div
            key={id}
            className="overflow-hidden rounded-xl border border-border-sage bg-white shadow-sm"
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
                  <TherapyBadge therapy={program.therapy} />
                  <ProgramStatusBadge status={program.status as ProgramStatus} />
                </div>
                <p className="mt-1 text-xs text-ink-ghost">
                  {program.programCode}
                  {program.startDateDisplay || program.startDate
                    ? ` · Started ${program.startDateDisplay || formatDate(program.startDate)}`
                    : ''}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
                  <span>
                    Therapist: <strong className="text-ink">{program.therapistName}</strong>
                  </span>
                  <span>
                    Room: <strong className="text-ink">{program.room}</strong>
                  </span>
                  <span>
                    Day {program.currentDay}/{program.totalDays}
                  </span>
                  {(program.totalFees ?? 0) > 0 ? (
                    <span>
                      Fees: {formatCurrency(program.totalFees ?? 0)}
                      {(program.amountPaid ?? 0) > 0
                        ? ` · Paid ${formatCurrency(program.amountPaid ?? 0)}`
                        : ''}
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 max-w-xs">
                  <AnimatedProgressBar progress={program.progress} />
                </div>
              </button>

              {showAttend ? (
                <Link to={programAttendPath(id)} className="shrink-0 self-center">
                  <Button type="button" className="gap-1.5 rounded-xl py-2 text-xs">
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    Attend
                  </Button>
                </Link>
              ) : null}
            </div>

            {isOpen ? (
              <div className="border-t border-border-sage bg-cream/20 px-4 py-4">
                {program.appointmentCode ? (
                  <p className="mb-3 text-xs text-ink-soft">
                    Linked visit:{' '}
                    <Link
                      to={panchakarmaTreatmentPath(program.appointmentCode)}
                      className="font-semibold text-sage-deep hover:underline"
                    >
                      {program.appointmentCode}
                    </Link>
                  </p>
                ) : null}

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
                                {session.panchakarmaType || program.therapy}
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
                      {assignedToOther ? (
                        <p className="mt-1 text-xs text-ink-ghost">
                          Assigned to {program.therapistName}. Log in as that therapist to add the
                          daily plan.
                        </p>
                      ) : null}
                    </div>
                    {showAttend ? (
                      <Link to={programAttendPath(id)}>
                        <Button type="button" className="gap-1.5 rounded-xl py-2 text-xs">
                          <ClipboardCheck className="h-3.5 w-3.5" />
                          Attend & add details
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
