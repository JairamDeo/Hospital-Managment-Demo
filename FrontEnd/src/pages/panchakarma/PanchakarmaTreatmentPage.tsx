import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formInputClass, formLabelClass, formSelectClass } from '@/components/ui/formStyles';
import { appointmentAdminService } from '@/services/appointment/appointmentAdmin.service';
import { panchakarmaAdminService } from '@/services/panchakarma/panchakarmaAdmin.service';
import { useToast } from '@/hooks/useToast';
import { useFormDraft } from '@/hooks/useFormDraft';
import { FormDraftPanel } from '@/components/ui/FormDraftPanel';
import { FORM_DRAFT_CATEGORIES, draftContextKeys } from '@/store/formDraftStorage';
import { getApiErrorMessage } from '@/utils/helpers';
import { ROUTES, patientDetailPath } from '@/constants/routes';
import { THERAPY_OPTIONS, type TherapyType } from '@/types/panchakarma.types';
import {
  OFFLINE_PAYMENT_METHOD_OPTIONS,
  type OfflinePaymentMethodType,
} from '@/types/billing.types';
import type { HmsAppointment } from '@/types/api.types';

interface DailyRow {
  dayNumber: number;
  sessionDate: string;
  time: string;
  duration: string;
  panchakarmaType: string;
  medicineContent: string;
}

interface PanchakarmaTreatmentDraft {
  appointmentCode: string;
  patientName: string;
  treatmentName: string;
  totalFees: string;
  totalDays: string;
  therapy: TherapyType;
  startDate: string;
  dailyRows: DailyRow[];
  markPaid: boolean;
  payAmount: string;
  paymentMethod: OfflinePaymentMethodType;
}

const addDaysIso = (base: string, days: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const PanchakarmaTreatmentPage = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [appointment, setAppointment] = useState<HmsAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [treatmentName, setTreatmentName] = useState('');
  const [totalFees, setTotalFees] = useState('');
  const [totalDays, setTotalDays] = useState('7');
  const [therapy, setTherapy] = useState<TherapyType>('Basti');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [dailyRows, setDailyRows] = useState<DailyRow[]>([]);
  const [markPaid, setMarkPaid] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<OfflinePaymentMethodType>('Cash');

  const buildDraftLabel = useCallback((draft: PanchakarmaTreatmentDraft) => {
    const name = draft.treatmentName.trim() || draft.therapy;
    return `${draft.patientName || 'Patient'} · ${name}`;
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
  } = useFormDraft<PanchakarmaTreatmentDraft>(FORM_DRAFT_CATEGORIES.panchakarmaTreatment, {
    buildLabel: buildDraftLabel,
  });

  const draftPayload = (): PanchakarmaTreatmentDraft => ({
    appointmentCode: appointment?.appointmentCode ?? appointmentId ?? '',
    patientName: appointment?.patientName ?? '',
    treatmentName,
    totalFees,
    totalDays,
    therapy,
    startDate,
    dailyRows,
    markPaid,
    payAmount,
    paymentMethod,
  });

  const applyDraft = (draft: PanchakarmaTreatmentDraft) => {
    setTreatmentName(draft.treatmentName);
    setTotalFees(draft.totalFees);
    setTotalDays(draft.totalDays);
    setTherapy(draft.therapy);
    setStartDate(draft.startDate);
    setDailyRows(draft.dailyRows);
    setMarkPaid(draft.markPaid);
    setPayAmount(draft.payAmount);
    setPaymentMethod(draft.paymentMethod);
  };

  const handleSaveDraft = () => {
    saveDraft(draftPayload(), {
      contextKey: appointmentId ? draftContextKeys.appointment(appointmentId) : 'unsaved',
    });
    showToast('Treatment plan draft saved', 'success');
  };

  const handleSaveNewDraft = () => {
    saveNewDraft(draftPayload(), {
      contextKey: appointmentId ? draftContextKeys.appointment(appointmentId) : 'unsaved',
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
    if (!appointmentId) return;
    appointmentAdminService
      .get(appointmentId)
      .then(({ data }) => {
        const row = data.res?.appointment;
        setAppointment(row ?? null);
        if (row) setStartDate(row.date || new Date().toISOString().slice(0, 10));
      })
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [appointmentId, showToast]);

  useEffect(() => {
    const days = Math.max(1, Number(totalDays) || 1);
    setDailyRows((prev) => {
      const next: DailyRow[] = [];
      for (let i = 0; i < days; i++) {
        const existing = prev[i];
        next.push(
          existing ?? {
            dayNumber: i + 1,
            sessionDate: addDaysIso(startDate, i),
            time: '10:00',
            duration: '45 min',
            panchakarmaType: therapy,
            medicineContent: '',
          }
        );
      }
      return next;
    });
  }, [totalDays, startDate, therapy]);

  if (!appointmentId) {
    return <Navigate to={ROUTES.ADMIN_APPOINTMENTS} replace />;
  }

  if (loading) {
    return <p className="py-16 text-center text-sm text-ink-soft">Loading appointment…</p>;
  }

  if (!appointment) {
    return <Navigate to={ROUTES.ADMIN_APPOINTMENTS} replace />;
  }

  const handleSubmit = async () => {
    const fees = Number(totalFees);
    const days = Number(totalDays);
    if (!treatmentName.trim()) {
      showToast('Enter treatment name', 'error');
      return;
    }
    if (!Number.isFinite(fees) || fees < 0) {
      showToast('Enter valid treatment fees', 'error');
      return;
    }
    if (!days || days < 1) {
      showToast('Enter number of days', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await panchakarmaAdminService.createTreatmentPlan(appointmentId, {
        treatmentName: treatmentName.trim(),
        totalFees: fees,
        totalDays: days,
        therapy,
        startDate,
        dailySessions: dailyRows.map((row) => ({
          dayNumber: row.dayNumber,
          sessionDate: row.sessionDate,
          time: row.time,
          duration: row.duration,
          panchakarmaType: row.panchakarmaType,
          medicineContent: row.medicineContent,
        })),
        markPaid,
        paymentMethod: markPaid || payAmount.trim() ? paymentMethod : undefined,
        payAmount: payAmount.trim() ? Number(payAmount) : undefined,
      });
      showToast('Treatment plan created', 'success');
      clearDraftAfterSubmit(
        appointmentId ? draftContextKeys.appointment(appointmentId) : undefined
      );
      navigate(patientDetailPath(appointment.patientCode));
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const updateRow = (index: number, patch: Partial<DailyRow>) => {
    setDailyRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  return (
    <div className="mx-auto w-full max-w-3xl pb-8">
      <Link
        to={ROUTES.ADMIN_APPOINTMENTS}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-sage-deep hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to appointments
      </Link>

      <h1 className="font-serif text-2xl font-bold text-sage-deep">Panchakarma treatment plan</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {appointment.patientName} · {appointment.appointmentCode}
      </p>

      <div className="mt-5 space-y-4">
        {hasDrafts ? (
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

        <div className="rounded-xl border border-border-sage bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className={formLabelClass}>Treatment name</span>
              <input
                type="text"
                value={treatmentName}
                onChange={(e) => setTreatmentName(e.target.value)}
                className={formInputClass}
                placeholder="e.g. Basti detox program"
              />
            </label>
            <label>
              <span className={formLabelClass}>Total fees (₹)</span>
              <input
                type="number"
                min={0}
                value={totalFees}
                onChange={(e) => setTotalFees(e.target.value)}
                className={formInputClass}
              />
            </label>
            <label>
              <span className={formLabelClass}>Number of days</span>
              <input
                type="number"
                min={1}
                value={totalDays}
                onChange={(e) => setTotalDays(e.target.value)}
                className={formInputClass}
              />
            </label>
            <label>
              <span className={formLabelClass}>Primary therapy</span>
              <select
                value={therapy}
                onChange={(e) => setTherapy(e.target.value as TherapyType)}
                className={formSelectClass}
              >
                {THERAPY_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={formLabelClass}>Start date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={formInputClass}
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-border-sage bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-serif text-lg font-semibold text-ink">Daily sessions</h2>
          <div className="space-y-3">
            {dailyRows.map((row, index) => (
              <div key={row.dayNumber} className="rounded-lg border border-border-sage bg-cream/20 p-3">
                <p className="mb-2 text-xs font-bold text-ink-ghost">Day {row.dayNumber}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label>
                    <span className={formLabelClass}>Date</span>
                    <input
                      type="date"
                      value={row.sessionDate}
                      onChange={(e) => updateRow(index, { sessionDate: e.target.value })}
                      className={formInputClass}
                    />
                  </label>
                  <label>
                    <span className={formLabelClass}>Time</span>
                    <input
                      type="time"
                      value={row.time}
                      onChange={(e) => updateRow(index, { time: e.target.value })}
                      className={formInputClass}
                    />
                  </label>
                  <label>
                    <span className={formLabelClass}>Duration</span>
                    <input
                      type="text"
                      value={row.duration}
                      onChange={(e) => updateRow(index, { duration: e.target.value })}
                      className={formInputClass}
                    />
                  </label>
                  <label>
                    <span className={formLabelClass}>Panchakarma</span>
                    <select
                      value={row.panchakarmaType}
                      onChange={(e) => updateRow(index, { panchakarmaType: e.target.value })}
                      className={formSelectClass}
                    >
                      {THERAPY_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                      <option value="Other">Other (manual below)</option>
                    </select>
                  </label>
                  <label className="sm:col-span-2">
                    <span className={formLabelClass}>Medicine / content</span>
                    <textarea
                      value={row.medicineContent}
                      onChange={(e) => updateRow(index, { medicineContent: e.target.value })}
                      rows={2}
                      className={`${formInputClass} resize-none`}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border-sage bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-serif text-lg font-semibold text-ink">Payment (optional)</h2>
          <label className="mb-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={markPaid}
              onChange={(e) => setMarkPaid(e.target.checked)}
            />
            Collect full payment now
          </label>
          {!markPaid ? (
            <label className="mb-3 block">
              <span className={formLabelClass}>Partial amount (₹)</span>
              <input
                type="number"
                min={0}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className={formInputClass}
              />
            </label>
          ) : null}
          {(markPaid || payAmount.trim()) && (
            <label className="block">
              <span className={formLabelClass}>Payment method</span>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as OfflinePaymentMethodType)}
                className={formSelectClass}
              >
                {OFFLINE_PAYMENT_METHOD_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void handleSubmit()} disabled={submitting}>
            Create treatment plan
          </Button>
          <Button type="button" variant="secondary" onClick={handleSaveDraft} disabled={submitting}>
            Save as draft
          </Button>
          {activeDraftId ? (
            <Button type="button" variant="secondary" onClick={handleSaveNewDraft} disabled={submitting}>
              Save as new draft
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PanchakarmaTreatmentPage;
