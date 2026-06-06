import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { CalendarCheck, FileText, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmActionModal } from '@/components/staff/detail/ConfirmActionModal';
import { formLabelClass, formSelectClass } from '@/components/ui/formStyles';
import { appointmentAdminService } from '@/services/appointment/appointmentAdmin.service';
import { staffAdminService } from '@/services/staff/staffAdmin.service';
import { useToast } from '@/hooks/useToast';
import { useFormDraft } from '@/hooks/useFormDraft';
import { FormDraftPanel } from '@/components/ui/FormDraftPanel';
import { FORM_DRAFT_CATEGORIES, draftContextKeys } from '@/store/formDraftStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { getApiErrorMessage } from '@/utils/helpers';
import { formatDateLabel, formatTimeLabel } from '@/utils/appointmentHelpers';
import { TIME_SLOTS } from '@/types/appointment.types';
import { ROUTES, patientDetailPath, prescriptionPath } from '@/constants/routes';
import {
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethodType,
} from '@/types/billing.types';
import type { HmsAppointment } from '@/types/api.types';

interface AppointmentAttendDraft {
  appointmentCode: string;
  patientName: string;
  consultationFee: string;
  visitNotes: string;
  followUpDate: string;
  followUpTimeSlot: string;
  followUpNotes: string;
  markPaid: boolean;
  paymentMethod: PaymentMethodType;
}

const addDaysIso = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const AppointmentFollowUpPage = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAdmin, isStaff, staffCode, staffRole, canEdit, canCreatePrescription } = usePermissions();
  const [appointment, setAppointment] = useState<HmsAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTimeSlot, setFollowUpTimeSlot] = useState('10:30');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [visitNotes, setVisitNotes] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [profileFee, setProfileFee] = useState<number | null>(null);
  const [markPaid, setMarkPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('Cash');
  const canCollectPayment = staffRole !== 'Doctor';

  const buildDraftLabel = useCallback((draft: AppointmentAttendDraft) => {
    const parts = [draft.patientName || 'Patient', draft.appointmentCode].filter(Boolean);
    if (draft.followUpDate) parts.push(`follow-up ${draft.followUpDate}`);
    return parts.join(' · ');
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
  } = useFormDraft<AppointmentAttendDraft>(FORM_DRAFT_CATEGORIES.appointmentAttend, {
    buildLabel: buildDraftLabel,
  });

  const draftPayload = (): AppointmentAttendDraft => ({
    appointmentCode: appointment?.appointmentCode ?? appointmentId ?? '',
    patientName: appointment?.patientName ?? '',
    consultationFee,
    visitNotes,
    followUpDate,
    followUpTimeSlot,
    followUpNotes,
    markPaid,
    paymentMethod,
  });

  const applyDraft = (draft: AppointmentAttendDraft) => {
    setConsultationFee(draft.consultationFee);
    setVisitNotes(draft.visitNotes);
    setFollowUpDate(draft.followUpDate);
    setFollowUpTimeSlot(draft.followUpTimeSlot);
    setFollowUpNotes(draft.followUpNotes);
    setMarkPaid(draft.markPaid);
    setPaymentMethod(draft.paymentMethod);
  };

  const handleSaveDraft = () => {
    saveDraft(draftPayload(), {
      contextKey: appointmentId ? draftContextKeys.appointment(appointmentId) : 'unsaved',
    });
    showToast('Visit draft saved', 'success');
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
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const { data } = await appointmentAdminService.get(appointmentId);
        const row = data.res?.appointment;
        if (!row) throw new Error('Appointment not found');
        if (!cancelled) {
          setAppointment(row);
          setFollowUpDate(row.followUpDate ?? '');
          setFollowUpTimeSlot(row.followUpTimeSlot ?? row.timeSlot ?? row.time ?? '10:30');
          setFollowUpNotes(row.followUpNotes ?? '');
          setVisitNotes(row.visitNotes ?? '');
          if (row.consultationFeeCharged != null) {
            setConsultationFee(String(row.consultationFeeCharged));
          }
        }

        if (row?.staffCode) {
          try {
            const staffRes = await staffAdminService.get(row.staffCode);
            const doctor = staffRes.data.res?.staff;
            if (doctor && !cancelled) {
              const fee = doctor.consultationFee;
              if (fee != null && fee > 0) {
                setProfileFee(fee);
                setConsultationFee((prev) => prev || String(fee));
              }
            }
          } catch {
            /* optional prefill */
          }
        }
      } catch (err) {
        if (!cancelled) {
          showToast(getApiErrorMessage(err), 'error');
          setAppointment(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [appointmentId, showToast]);

  const canManage = useMemo(() => {
    if (!appointment) return false;
    if (isAdmin) return canEdit('appointments');
    if (isStaff && staffCode && appointment.staffCode === staffCode) {
      return canEdit('appointments');
    }
    return false;
  }, [appointment, isAdmin, isStaff, staffCode, canEdit]);

  if (!appointmentId) {
    return <Navigate to={ROUTES.ADMIN_APPOINTMENTS} replace />;
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[720px] py-16 text-center text-sm text-ink-soft">
        Loading visit…
      </div>
    );
  }

  if (!appointment) {
    return <Navigate to={ROUTES.ADMIN_APPOINTMENTS} replace />;
  }

  const isCompleted = appointment.status === 'Completed';
  const isCancelled = appointment.status === 'Cancelled';
  const feeLabel = 'Consultation fee (₹)';

  const handleSave = async () => {
    if (!isCompleted) {
      const fee = Number(consultationFee);
      const hasFeeInput = consultationFee.trim() && Number.isFinite(fee) && fee >= 0;
      if (!hasFeeInput && profileFee == null) {
        showToast('Please enter the consultation fee', 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      const feeNum = consultationFee.trim() ? Number(consultationFee) : undefined;
      const { data } = await appointmentAdminService.attend(appointmentId, {
        consultationFee: !isCompleted ? feeNum : undefined,
        visitNotes: visitNotes.trim() || undefined,
        followUpDate: followUpDate || undefined,
        followUpTimeSlot: followUpDate ? followUpTimeSlot : undefined,
        followUpNotes: followUpNotes.trim() || undefined,
        markPaid: !isCompleted && canCollectPayment && markPaid ? true : undefined,
        paymentMethod: !isCompleted && canCollectPayment && markPaid ? paymentMethod : undefined,
      });
      if (data.res?.appointment) {
        clearDraftAfterSubmit(
          appointmentId ? draftContextKeys.appointment(appointmentId) : undefined
        );
        showToast(
          followUpDate || followUpNotes.trim()
            ? 'Visit completed and follow-up saved'
            : 'Visit marked as attended',
          'success'
        );
        if (!isCompleted && canCreatePrescription) {
          navigate(prescriptionPath(appointment.patientCode, appointment.appointmentCode));
        } else {
          navigate(patientDetailPath(appointment.patientCode), {
            state: {
              activeTab: canCreatePrescription ? ('prescriptions' as const) : ('appointments' as const),
            },
          });
        }
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[720px] pb-8">
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
          Visit &amp; Follow-up
        </p>
        <h1 className="font-serif text-2xl font-bold text-sage-deep">
          {isCompleted ? 'Follow-up details' : 'Complete visit'}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Mark the visit as attended, enter the fee for this visit, and optionally schedule a
          follow-up.
        </p>
      </div>

      <div className="mb-5 overflow-hidden rounded-2xl border border-border-sage bg-white shadow-sm">
        <div className="border-b border-border-sage bg-cream/40 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage-deep text-white">
              <CalendarCheck className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <p className="font-semibold text-ink">{appointment.appointmentCode}</p>
              <p className="text-xs text-ink-soft">
                {formatDateLabel(appointment.date)} · {formatTimeLabel(appointment.time)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCell
              label="Patient"
              value={
                <Link
                  to={patientDetailPath(appointment.patientCode)}
                  className="font-medium text-sage-deep hover:underline"
                >
                  {appointment.patientName}
                </Link>
              }
            />
            <InfoCell label="Doctor" value={appointment.doctorName} />
            <InfoCell label="Type" value={appointment.appointmentType} />
            <InfoCell label="Status" value={appointment.status} />
          </div>

          {appointment.notes ? (
            <div className="rounded-xl border border-border-sage bg-cream/30 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                Appointment notes
              </p>
              <p className="mt-1 text-sm text-ink-soft">{appointment.notes}</p>
            </div>
          ) : null}

          {isCompleted && appointment.attendedBy?.name ? (
            <div className="rounded-xl border border-border-sage bg-sage-mist/30 px-4 py-3 text-sm text-ink-soft">
              Attended by <span className="font-semibold text-ink">{appointment.attendedBy.name}</span>
              {appointment.attendedAt
                ? ` · ${new Date(appointment.attendedAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : null}
            </div>
          ) : null}
        </div>
      </div>

      {isCancelled ? (
        <p className="rounded-xl border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
          This appointment was cancelled and cannot be marked as attended.
        </p>
      ) : canManage ? (
        <div className="space-y-5">
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

          {!isCompleted ? (
            <div className="rounded-2xl border border-border-sage bg-white p-5 shadow-sm">
              <h2 className="mb-1 font-serif text-lg font-semibold text-ink">Visit fee</h2>
              <p className="mb-4 text-sm text-ink-soft">
                Same consultation fee for new visits and follow-ups. Prefilled from the doctor
                profile — change if needed. Support staff collects payment from billing.
              </p>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-ink-ghost">{feeLabel}</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                  placeholder={profileFee != null ? String(profileFee) : 'Enter amount'}
                  className="w-full max-w-xs rounded-lg border border-border-sage bg-white px-3 py-2 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage-pale"
                />
                {profileFee != null ? (
                  <p className="mt-1 text-xs text-ink-ghost">
                    Doctor profile fee: ₹{profileFee}
                  </p>
                ) : null}
              </label>

              <label className="mt-4 block">
                <span className="mb-1 block text-xs font-semibold text-ink-ghost">
                  Visit notes for patient
                </span>
                <textarea
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  rows={3}
                  placeholder="Doctor suggestions, lifestyle advice, diet changes…"
                  className="w-full resize-none rounded-lg border border-border-sage bg-white px-3 py-2 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage-pale"
                />
              </label>

              {canCollectPayment ? (
                <>
                  <label className="mt-3 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={markPaid}
                      onChange={(e) => setMarkPaid(e.target.checked)}
                    />
                    Collect payment now
                  </label>

                  {markPaid ? (
                    <label className="mt-2 block max-w-xs">
                      <span className={formLabelClass}>Payment method</span>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                        className={formSelectClass}
                      >
                        {PAYMENT_METHOD_OPTIONS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </>
              ) : null}
            </div>
          ) : null}

          {isCompleted && canCreatePrescription ? (
            <div className="rounded-2xl border border-sage/40 bg-sage-mist/20 p-5 shadow-sm">
              <h2 className="mb-1 font-serif text-lg font-semibold text-ink">Prescription</h2>
              <p className="mb-4 text-sm text-ink-soft">
                Visit completed. Write a structured prescription for this patient.
              </p>
              <Link to={prescriptionPath(appointment.patientCode, appointment.appointmentCode)}>
                <Button type="button" className="gap-2 rounded-xl">
                  <FileText className="h-4 w-4" />
                  Write prescription
                </Button>
              </Link>
            </div>
          ) : null}

        <div className="rounded-2xl border border-border-sage bg-white p-5 shadow-sm">
          <h2 className="mb-1 font-serif text-lg font-semibold text-ink">
            Follow-up <span className="text-sm font-normal text-ink-soft">(optional)</span>
          </h2>
          <p className="mb-4 text-sm text-ink-soft">
            If the doctor advised a return visit, set the follow-up date and time below. The patient
            receives an SMS reminder 1 hour before the slot.
          </p>

          <div className="mb-3 flex flex-wrap gap-2">
            {[7, 14, 21, 30].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setFollowUpDate(addDaysIso(days))}
                className="cursor-pointer rounded-full border border-border-sage bg-cream/40 px-3 py-1 text-xs font-semibold text-ink-soft hover:bg-sage-mist hover:text-ink"
              >
                In {days} days
              </button>
            ))}
          </div>

          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-semibold text-ink-ghost">Follow-up date</span>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-border-sage bg-white px-3 py-2 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage-pale"
            />
          </label>

          {followUpDate ? (
            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-semibold text-ink-ghost">Follow-up time</span>
              <select
                value={followUpTimeSlot}
                onChange={(e) => setFollowUpTimeSlot(e.target.value)}
                className="w-full rounded-lg border border-border-sage bg-white px-3 py-2 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage-pale"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {formatTimeLabel(slot)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="mb-4 block">
            <span className="mb-1 block text-xs font-semibold text-ink-ghost">Follow-up notes</span>
            <textarea
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Review Panchakarma progress, continue medication…"
              className="w-full resize-none rounded-lg border border-border-sage bg-white px-3 py-2 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage-pale"
            />
          </label>

          {appointment.followUpAddedBy?.name ? (
            <p className="mb-4 flex items-center gap-1.5 text-xs text-ink-ghost">
              <UserRound className="h-3.5 w-3.5" />
              Follow-up added by {appointment.followUpAddedBy.name}
              {appointment.followUpAddedAt
                ? ` · ${new Date(appointment.followUpAddedAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}`
                : null}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={submitting}
            >
              {isCompleted ? 'Update follow-up' : 'Complete visit & save'}
            </Button>
            <Button type="button" variant="secondary" onClick={handleSaveDraft} disabled={submitting}>
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
            <Button
              variant="secondary"
              onClick={() => navigate(patientDetailPath(appointment.patientCode))}
              disabled={submitting}
            >
              Back to patient
            </Button>
          </div>
        </div>
        </div>
      ) : (
        <p className="text-sm text-ink-soft">You do not have permission to update this visit.</p>
      )}

      <ConfirmActionModal
        open={confirmOpen}
        title={isCompleted ? 'Update follow-up?' : 'Complete this visit?'}
        message={
          !isCompleted
            ? followUpDate
              ? `Complete visit with ${feeLabel.replace(' (₹)', '')} ₹${consultationFee} and schedule follow-up on ${formatDateLabel(followUpDate)}?`
              : `Complete visit and record ${feeLabel.replace(' (₹)', '')} ₹${consultationFee}?`
            : followUpDate
              ? `Update follow-up to ${formatDateLabel(followUpDate)} at ${formatTimeLabel(followUpTimeSlot)}?`
              : 'Save follow-up changes?'
        }
        confirmLabel={isCompleted ? 'Save' : 'Complete visit'}
        loading={submitting}
        onConfirm={() => void handleSave()}
        onClose={() => !submitting && setConfirmOpen(false)}
      />
    </div>
  );
};

const InfoCell = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="rounded-lg bg-cream/50 px-3 py-2.5">
    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">{label}</p>
    <div className="mt-0.5 text-sm text-ink">{value}</div>
  </div>
);

export default AppointmentFollowUpPage;
