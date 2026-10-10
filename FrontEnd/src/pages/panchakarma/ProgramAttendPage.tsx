import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NumericInput } from '@/components/ui/NumericInput';
import { formInputClass, formLabelClass } from '@/components/ui/formStyles';
import { TherapyTypeMultiSelect } from '@/components/panchakarma/TherapyTypeMultiSelect';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useFormDraft } from '@/hooks/useFormDraft';
import { FormDraftPanel } from '@/components/ui/FormDraftPanel';
import { FORM_DRAFT_CATEGORIES, draftContextKeys } from '@/store/formDraftStorage';
import { panchakarmaAdminService } from '@/services/panchakarma/panchakarmaAdmin.service';
import { getApiErrorMessage } from '@/utils/helpers';
import { ROUTES, patientDetailPath } from '@/constants/routes';
import {
  type ProgramAttendPayload,
  type ScheduleProgramDailySession,
  type TherapyType,
} from '@/types/panchakarma.types';
import type { HmsPanchakarmaProgram } from '@/types/api.types';
import {
  isTherapistAssignedToProgram,
  joinTherapyTypes,
  parseTherapyTypes,
  programNeedsAttend,
} from '@/utils/panchakarmaHelpers';

const addDaysIso = (base: string, days: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const emptyDailyRow = (dayNumber: number, startDate: string): ScheduleProgramDailySession => ({
  dayNumber,
  sessionDate: addDaysIso(startDate, dayNumber - 1),
  time: '10:00',
  duration: '45 min',
  panchakarmaType: '',
  medicineContent: '',
});

const formatDateDisplay = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

interface ProgramAttendDraft {
  programCode: string;
  patientName: string;
  treatmentName: string;
  totalFees: number;
  dailyRows: ScheduleProgramDailySession[];
  expandedDays: number[];
}

export const ProgramAttendPage = () => {
  const { programCode } = useParams<{ programCode: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { staffRole, staffCode, canView, canEdit, isAdmin } = usePermissions();

  const isTherapist = staffRole === 'Therapist' && Boolean(staffCode);
  const isDoctor = staffRole === 'Doctor';
  const canScheduleDetails =
    isAdmin || (isDoctor && canEdit('panchakarma'));
  const viewOnly = isTherapist && canView('panchakarma');

  const [program, setProgram] = useState<HmsPanchakarmaProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [treatmentName, setTreatmentName] = useState('');
  const [totalFees, setTotalFees] = useState(0);
  const [dailyRows, setDailyRows] = useState<ScheduleProgramDailySession[]>([]);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(() => new Set([1]));

  const buildDraftLabel = useCallback((draft: ProgramAttendDraft) => {
    const name = draft.treatmentName.trim() || 'Untitled';
    return `${draft.patientName || 'Patient'} · ${draft.programCode} · ${name}`;
  }, []);

  const {
    drafts,
    hasDrafts,
    activeDraftId,
    saveDraft,
    saveNewDraft,
    restoreDraft,
    discardDraft,
    clearDraftAfterSubmit,
  } = useFormDraft<ProgramAttendDraft>(FORM_DRAFT_CATEGORIES.panchakarmaAttend, {
    buildLabel: buildDraftLabel,
  });

  const draftPayload = (): ProgramAttendDraft => ({
    programCode: program?.programCode ?? programCode ?? '',
    patientName: program?.patientName ?? '',
    treatmentName,
    totalFees,
    dailyRows,
    expandedDays: [...expandedDays],
  });

  const applyDraft = (draft: ProgramAttendDraft) => {
    setTreatmentName(draft.treatmentName);
    setTotalFees(draft.totalFees);
    setDailyRows(draft.dailyRows);
    setExpandedDays(new Set(draft.expandedDays.length ? draft.expandedDays : [1]));
  };

  const handleSaveDraft = () => {
    saveDraft(draftPayload(), {
      contextKey: programCode ? draftContextKeys.program(programCode) : 'unsaved',
    });
    showToast('Program draft saved', 'success');
  };

  const handleSaveNewDraft = () => {
    saveNewDraft(draftPayload(), {
      contextKey: programCode ? draftContextKeys.program(programCode) : 'unsaved',
    });
    showToast('New draft saved', 'success');
  };

  const handleRestoreDraft = (id: string) => {
    const draft = restoreDraft(id);
    if (!draft) return;
    applyDraft(draft);
    showToast('Draft restored — continue editing', 'success');
  };

  useEffect(() => {
    if (!programCode) return;
    setLoading(true);
    panchakarmaAdminService
      .getProgram(programCode)
      .then((res) => {
        const loaded = res.data.res?.program ?? null;
        setProgram(loaded);
        if (loaded) {
          const startDate = loaded.startDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
          setTreatmentName(loaded.treatmentName?.trim() || '');
          setTotalFees(loaded.totalFees ?? 0);
          if (loaded.dailySessions?.length) {
            setDailyRows(
              loaded.dailySessions.map((s) => ({
                dayNumber: s.dayNumber,
                sessionDate: s.sessionDate
                  ? String(s.sessionDate).slice(0, 10)
                  : addDaysIso(startDate, s.dayNumber - 1),
                time: s.time || '10:00',
                duration: s.duration || '45 min',
                panchakarmaType: s.panchakarmaType || '',
                medicineContent: s.medicineContent || '',
              }))
            );
          } else {
            const rows: ScheduleProgramDailySession[] = [];
            for (let i = 0; i < loaded.totalDays; i++) {
              rows.push(emptyDailyRow(i + 1, startDate));
            }
            setDailyRows(rows);
          }
          setExpandedDays(new Set([1]));
        }
      })
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [programCode, showToast]);

  const startDate = program?.startDate?.slice(0, 10) ?? '';

  useEffect(() => {
    if (!program || dailyRows.length === program.totalDays) return;
    setDailyRows((prev) => {
      const next: ScheduleProgramDailySession[] = [];
      for (let i = 0; i < program.totalDays; i++) {
        next.push(prev[i] ?? emptyDailyRow(i + 1, startDate));
      }
      return next;
    });
  }, [program, startDate, dailyRows.length]);

  const canAccess = useMemo(() => {
    if (!canView('panchakarma') || !program) return false;
    if (canScheduleDetails) return true;
    if (viewOnly && staffCode) return isTherapistAssignedToProgram(program, staffCode);
    return false;
  }, [canView, program, canScheduleDetails, viewOnly, staffCode]);

  if (!canView('panchakarma') || (!canScheduleDetails && !viewOnly)) {
    return <Navigate to={ROUTES.ADMIN_PANCHAKARMA} replace />;
  }

  if (!loading && program && !canAccess) {
    return <Navigate to={ROUTES.ADMIN_PANCHAKARMA} replace />;
  }

  const programLocked =
    program?.status === 'Complete' || program?.status === 'Cancelled';
  const readOnly = viewOnly || !canScheduleDetails || programLocked;

  const updateRow = (index: number, patch: Partial<ScheduleProgramDailySession>) => {
    if (readOnly) return;
    setDailyRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const toggleDay = (dayNumber: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayNumber)) next.delete(dayNumber);
      else next.add(dayNumber);
      return next;
    });
  };

  const expandAllDays = () => {
    setExpandedDays(new Set(dailyRows.map((row) => row.dayNumber)));
  };

  const collapseAllDays = () => {
    setExpandedDays(new Set());
  };

  const handleSubmit = async () => {
    if (readOnly) return;
    if (!programCode || !treatmentName.trim()) {
      showToast('Enter treatment / program name', 'error');
      return;
    }
    if (Number.isNaN(totalFees) || totalFees < 0) {
      showToast('Enter total fees (0 or more)', 'error');
      return;
    }

    const payload: ProgramAttendPayload = {
      treatmentName: treatmentName.trim(),
      totalFees,
      dailySessions: dailyRows,
    };

    setSubmitting(true);
    try {
      const { data } = await panchakarmaAdminService.attendProgram(programCode, payload);
      if (data.status_code === 200) {
        clearDraftAfterSubmit(programCode ? draftContextKeys.program(programCode) : undefined);
        showToast('Program details saved', 'success');
        const patientId = program?.patientCode ?? program?.patientId;
        if (patientId) {
          navigate(patientDetailPath(patientId), { state: { activeTab: 'panchakarma' as const } });
        } else {
          navigate(ROUTES.ADMIN_PANCHAKARMA);
        }
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const backTo = program
    ? patientDetailPath(program.patientCode ?? program.patientId)
    : ROUTES.ADMIN_PANCHAKARMA;

  if (loading) {
    return <p className="py-12 text-center text-sm text-ink-soft">Loading program…</p>;
  }

  if (!program) {
    return <p className="py-12 text-center text-sm text-ink-soft">Program not found.</p>;
  }

  const needsPlan = programNeedsAttend(program);

  return (
    <div className="mx-auto w-full max-w-3xl pb-8">
      <Link
        to={backTo}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-sage-deep hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to patient
      </Link>

      <h1 className="font-serif text-2xl font-bold text-sage-deep">
        {readOnly ? 'Program schedule' : needsPlan ? 'Program details' : 'Edit program details'}
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        {readOnly
          ? `${program.patientName} · view day-wise plan and medicines`
          : `${user?.name ?? 'Staff'} · day-wise treatment plan for ${program.patientName}`}
      </p>

      <div className="mt-5 space-y-4">
        {!readOnly && hasDrafts ? (
          <FormDraftPanel
            drafts={drafts}
            activeDraftId={activeDraftId}
            onRestore={handleRestoreDraft}
            onDiscard={(id) => {
              discardDraft(id);
              showToast('Draft discarded', 'success');
            }}
          />
        ) : null}

        <div className="rounded-xl border border-border-sage bg-cream/30 p-4 shadow-sm">
          <h2 className="mb-3 font-serif text-lg font-semibold text-ink">Schedule</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-ink-ghost">Patient</dt>
              <dd className="text-ink">{program.patientName}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-ink-ghost">Program ID</dt>
              <dd className="text-ink">{program.programCode}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-ink-ghost">
                Number of days
              </dt>
              <dd className="text-ink">{program.totalDays} days</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-ink-ghost">
                Therapist
              </dt>
              <dd className="text-ink">{program.therapistName}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-ink-ghost">Start date</dt>
              <dd className="text-ink">
                {program.startDateDisplay || formatDateDisplay(program.startDate)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-border-sage bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-serif text-lg font-semibold text-ink">Treatment details</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className={formLabelClass}>Program / treatment name *</span>
              <input
                type="text"
                value={treatmentName}
                onChange={(e) => setTreatmentName(e.target.value)}
                className={formInputClass}
                placeholder="e.g. 7-day detox program"
                disabled={readOnly}
              />
            </label>
            <label className="sm:col-span-2">
              <span className={formLabelClass}>Total fees *</span>
              <NumericInput
                value={totalFees}
                onChange={setTotalFees}
                min={0}
                allowDecimal
                placeholder="Enter amount"
                disabled={readOnly}
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-border-sage bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-lg font-semibold text-ink">Daily schedule</h2>
              <p className="mt-1 text-sm text-ink-soft">
                {readOnly
                  ? 'Therapies and medicines for each day.'
                  : 'Set date, therapies (multi-select), and medicine for each day.'}
              </p>
            </div>
            {dailyRows.length > 1 ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={expandAllDays}
                  className="text-xs font-semibold text-sage-deep hover:underline"
                >
                  Expand all
                </button>
                <span className="text-ink-ghost">·</span>
                <button
                  type="button"
                  onClick={collapseAllDays}
                  className="text-xs font-semibold text-sage-deep hover:underline"
                >
                  Collapse all
                </button>
              </div>
            ) : null}
          </div>
          <div className="space-y-2">
            {dailyRows.map((row, index) => {
              const isOpen = expandedDays.has(row.dayNumber);
              const selectedTherapies = parseTherapyTypes(row.panchakarmaType);
              return (
                <div
                  key={row.dayNumber}
                  className="overflow-hidden rounded-lg border border-border-sage bg-cream/20"
                >
                  <button
                    type="button"
                    onClick={() => toggleDay(row.dayNumber)}
                    className="flex w-full cursor-pointer items-center gap-2 px-3 py-3 text-left hover:bg-sage-mist/30"
                  >
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-ink-ghost" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-ink-ghost" />
                    )}
                    <span className="text-xs font-bold text-ink">Day {row.dayNumber}</span>
                    <span className="truncate text-xs text-ink-ghost">
                      {formatDateDisplay(row.sessionDate)}
                      {row.time ? ` · ${row.time}` : ''}
                      {row.panchakarmaType ? ` · ${row.panchakarmaType}` : ''}
                    </span>
                  </button>

                  {isOpen ? (
                    <div className="border-t border-border-sage px-3 pb-3 pt-2">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label>
                          <span className={formLabelClass}>Date</span>
                          <input
                            type="date"
                            value={row.sessionDate}
                            onChange={(e) => updateRow(index, { sessionDate: e.target.value })}
                            className={formInputClass}
                            disabled={readOnly}
                          />
                        </label>
                        <label>
                          <span className={formLabelClass}>Time</span>
                          <input
                            type="time"
                            value={row.time}
                            onChange={(e) => updateRow(index, { time: e.target.value })}
                            className={formInputClass}
                            disabled={readOnly}
                          />
                        </label>
                        <label>
                          <span className={formLabelClass}>Duration</span>
                          <input
                            type="text"
                            value={row.duration}
                            onChange={(e) => updateRow(index, { duration: e.target.value })}
                            className={formInputClass}
                            placeholder="45 min"
                            disabled={readOnly}
                          />
                        </label>
                        <div className="sm:col-span-2">
                          <TherapyTypeMultiSelect
                            value={selectedTherapies}
                            onChange={(next: TherapyType[]) =>
                              updateRow(index, { panchakarmaType: joinTherapyTypes(next) })
                            }
                            disabled={readOnly}
                          />
                        </div>
                        <label className="sm:col-span-2">
                          <span className={formLabelClass}>Medicine / session notes</span>
                          <textarea
                            value={row.medicineContent}
                            onChange={(e) => updateRow(index, { medicineContent: e.target.value })}
                            rows={2}
                            className={`${formInputClass} resize-none`}
                            placeholder="Oils, herbs, procedure notes…"
                            disabled={readOnly}
                          />
                        </label>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!readOnly ? (
            <>
              <Button onClick={() => void handleSubmit()} disabled={submitting}>
                {submitting ? 'Saving…' : 'Save program details'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleSaveDraft}
                disabled={submitting}
              >
                Save as draft
              </Button>
              {activeDraftId ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSaveNewDraft}
                  disabled={submitting}
                >
                  Save as new draft
                </Button>
              ) : null}
            </>
          ) : null}
          <Button variant="secondary" onClick={() => navigate(backTo)} disabled={submitting}>
            {readOnly ? 'Back' : 'Cancel'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProgramAttendPage;
