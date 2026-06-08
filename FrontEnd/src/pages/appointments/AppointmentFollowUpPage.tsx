import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { CalendarCheck, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmActionModal } from '@/components/staff/detail/ConfirmActionModal';
import { PrescriptionEditor } from '@/components/prescriptions/PrescriptionEditor';
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
import { ROUTES, patientDetailPath } from '@/constants/routes';
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
  markPaid: boolean;
  paymentMethod: PaymentMethodType;
}

interface FollowUpDraft {
  appointmentCode: string;
  patientName: string;
  followUpDate: string;
  followUpTimeSlot: string;
  followUpNotes: string;
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

  const buildAttendDraftLabel = useCallback((draft: AppointmentAttendDraft) => {
    return `${draft.patientName || 'Patient'} · ${draft.appointmentCode} · visit`;
  }, []);

  const buildFollowUpDraftLabel = useCallback((draft: FollowUpDraft) => {
    const parts = [draft.patientName || 'Patient', draft.appointmentCode];
    if (draft.followUpDate) parts.push(`follow-up ${draft.followUpDate}`);
    return parts.join(' · ');
  }, []);

  const attendDraft = useFormDraft<AppointmentAttendDraft>(FORM_DRAFT_CATEGORIES.appointmentAttend, {
    buildLabel: buildAttendDraftLabel,
  });

  const followUpDraft = useFormDraft<FollowUpDraft>(FORM_DRAFT_CATEGORIES.appointmentFollowUp, {
    buildLabel: buildFollowUpDraftLabel,
  });

  const loadAppointment = useCallback(async () => {
    if (!appointmentId) return null;
    const { data } = await appointmentAdminService.get(appointmentId);
    const row = data.res?.appointment;
    if (!row) throw new Error('Appointment not found');
    setAppointment(row);
    setFollowUpDate(row.followUpDate ?? '');
    setFollowUpTimeSlot(row.followUpTimeSlot ?? row.timeSlot ?? row.time ?? '10:30');
    setFollowUpNotes(row.followUpNotes ?? '');
    setVisitNotes(row.visitNotes ?? '');
    if (row.consultationFeeCharged != null) {
      setConsultationFee(String(row.consultationFeeCharged));
    }
    return row;
  }, [appointmentId]);

  useEffect(() => {
    if (!appointmentId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const row = await loadAppointment();
        if (cancelled || !row?.staffCode) return;

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
  }, [appointmentId, loadAppointment, showToast]);

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
      <div className="mx-auto w-full max-w-5xl py-16 text-center text-sm text-ink-soft">
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

  const attendDraftPayload = (): AppointmentAttendDraft => ({
    appointmentCode: appointment.appointmentCode ?? appointmentId ?? '',
    patientName: appointment.patientName ?? '',
    consultationFee,
    visitNotes,
    markPaid,
    paymentMethod,
  });

  const followUpDraftPayload = (): FollowUpDraft => ({
    appointmentCode: appointment.appointmentCode ?? appointmentId ?? '',
    patientName: appointment.patientName ?? '',
    followUpDate,
    followUpTimeSlot,
    followUpNotes,
  });

  const applyAttendDraft = (draft: AppointmentAttendDraft) => {
    setConsultationFee(draft.consultationFee);
    setVisitNotes(draft.visitNotes);
    setMarkPaid(draft.markPaid);
    setPaymentMethod(draft.paymentMethod);
  };

  const applyFollowUpDraft = (draft: FollowUpDraft) => {
    setFollowUpDate(draft.followUpDate);
    setFollowUpTimeSlot(draft.followUpTimeSlot);
    setFollowUpNotes(draft.followUpNotes);
  };

  const handleCompleteVisit = async () => {
    const fee = Number(consultationFee);
    const hasFeeInput = consultationFee.trim() && Number.isFinite(fee) && fee >= 0;
    if (!hasFeeInput && profileFee == null) {
      showToast('Please enter the consultation fee', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const feeNum = consultationFee.trim() ? Number(consultationFee) : undefined;
      const { data } = await appointmentAdminService.attend(appointmentId, {
        consultationFee: feeNum,
        visitNotes: visitNotes.trim() || undefined,
        markPaid: canCollectPayment && markPaid ? true : undefined,
        paymentMethod: canCollectPayment && markPaid ? paymentMethod : undefined,
      });
      if (data.res?.appointment) {
        attendDraft.clearDraftAfterSubmit(
          appointmentId ? draftContextKeys.appointment(appointmentId) : undefined
        );
        setAppointment(data.res.appointment);
        showToast('Visit completed', 'success');
        if (!canCreatePrescription) {
          navigate(patientDetailPath(appointment.patientCode), {
            state: { activeTab: 'appointments' as const },
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

  const handleSaveFollowUp = async () => {
    setSubmitting(true);
    try {
      const { data } = await appointmentAdminService.attend(appointmentId, {
        followUpDate: followUpDate || undefined,
        followUpTimeSlot: followUpDate ? followUpTimeSlot : undefined,
        followUpNotes: followUpNotes.trim() || undefined,
      });
      if (data.res?.appointment) {
        followUpDraft.clearDraftAfterSubmit(
          appointmentId ? draftContextKeys.appointment(appointmentId) : undefined
        );
        setAppointment(data.res.appointment);
        showToast(
          followUpDate || followUpNotes.trim() ? 'Follow-up saved' : 'Changes saved',
          'success'
        );
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl pb-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
            {isCompleted ? 'Post-visit' : 'Visit'}
          </p>
          <h1 className="font-serif text-2xl font-bold text-sage-deep">
            {isCompleted ? 'Follow-up & prescription' : 'Complete visit'}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {isCompleted
              ? 'Schedule a follow-up and write the prescription for this visit.'
              : 'Mark attended, enter consultation fee and visit notes.'}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border-sage bg-white px-3 py-2 text-sm shadow-sm">
          <CalendarCheck className="h-4 w-4 text-sage-deep" />
          <span className="font-semibold text-ink">{appointment.appointmentCode}</span>
          <span className="text-ink-ghost">·</span>
          <span className="text-ink-soft">
            {formatDateLabel(appointment.date)} · {formatTimeLabel(appointment.time)}
          </span>
        </div>
      </div>

      {isCancelled ? (
        <p className="rounded-xl border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
          This appointment was cancelled and cannot be marked as attended.
        </p>
      ) : !canManage ? (
        <p className="text-sm text-ink-soft">You do not have permission to update this visit.</p>
      ) : !isCompleted ? (
        <div className="space-y-4">
          {attendDraft.hasDrafts ? (
            <FormDraftPanel
              drafts={attendDraft.drafts}
              activeDraftId={attendDraft.activeDraftId}
              onRestore={(id) => {
                const draft = attendDraft.restoreDraft(id);
                if (draft) {
                  applyAttendDraft(draft);
                  showToast('Draft restored', 'success');
                }
              }}
              onDiscard={(id) => {
                attendDraft.discardDraft(id);
                showToast('Draft discarded', 'success');
              }}
            />
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border-sage bg-white p-4 shadow-sm">
              <h2 className="mb-3 font-serif text-base font-semibold text-ink">Patient details</h2>
              <div className="grid grid-cols-2 gap-2">
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
                <p className="mt-3 rounded-lg bg-cream/40 px-3 py-2 text-xs text-ink-soft">
                  {appointment.notes}
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-border-sage bg-white p-4 shadow-sm">
              <h2 className="mb-1 font-serif text-base font-semibold text-ink">Visit fee</h2>
              <p className="mb-3 text-xs text-ink-soft">
                Prefilled from doctor profile. Support staff collects payment from billing.
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
                  className="w-full rounded-lg border border-border-sage bg-white px-3 py-2 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage-pale"
                />
                {profileFee != null ? (
                  <p className="mt-1 text-xs text-ink-ghost">Profile fee: ₹{profileFee}</p>
                ) : null}
              </label>

              <label className="mt-3 block">
                <span className="mb-1 block text-xs font-semibold text-ink-ghost">
                  Visit notes for patient
                </span>
                <textarea
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  rows={3}
                  placeholder="Suggestions, lifestyle advice, diet changes…"
                  className="w-full resize-none rounded-lg border border-border-sage bg-white px-3 py-2 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage-pale"
                />
              </label>

              {canCollectPayment ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={markPaid}
                      onChange={(e) => setMarkPaid(e.target.checked)}
                    />
                    Collect payment now
                  </label>
                  {markPaid ? (
                    <label className="block sm:col-span-2">
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
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setConfirmOpen(true)} disabled={submitting}>
              Complete visit & save
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                attendDraft.saveDraft(attendDraftPayload(), {
                  contextKey: appointmentId ? draftContextKeys.appointment(appointmentId) : 'unsaved',
                });
                showToast('Visit draft saved', 'success');
              }}
              disabled={submitting}
            >
              Save as draft
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(patientDetailPath(appointment.patientCode))}
              disabled={submitting}
            >
              Back to patient
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {followUpDraft.hasDrafts ? (
            <FormDraftPanel
              drafts={followUpDraft.drafts}
              activeDraftId={followUpDraft.activeDraftId}
              onRestore={(id) => {
                const draft = followUpDraft.restoreDraft(id);
                if (draft) {
                  applyFollowUpDraft(draft);
                  showToast('Draft restored', 'success');
                }
              }}
              onDiscard={(id) => {
                followUpDraft.discardDraft(id);
                showToast('Draft discarded', 'success');
              }}
            />
          ) : null}

          <div
            className={`grid gap-4 ${canCreatePrescription ? 'xl:grid-cols-2' : 'max-w-xl'}`}
          >
            <div className="rounded-2xl border border-border-sage bg-white p-4 shadow-sm">
              <h2 className="mb-1 font-serif text-base font-semibold text-ink">
                Follow-up <span className="text-sm font-normal text-ink-soft">(optional)</span>
              </h2>
              <p className="mb-3 text-xs text-ink-soft">
                Patient receives an SMS reminder 1 hour before the slot.
              </p>

              <div className="mb-3 flex flex-wrap gap-1.5">
                {[7, 14, 21, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setFollowUpDate(addDaysIso(days))}
                    className="cursor-pointer rounded-full border border-border-sage bg-cream/40 px-2.5 py-0.5 text-xs font-semibold text-ink-soft hover:bg-sage-mist"
                  >
                    +{days}d
                  </button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-xs font-semibold text-ink-ghost">
                    Follow-up date
                  </span>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="w-full rounded-lg border border-border-sage bg-white px-3 py-2 text-sm"
                  />
                </label>

                {followUpDate ? (
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-semibold text-ink-ghost">Time</span>
                    <select
                      value={followUpTimeSlot}
                      onChange={(e) => setFollowUpTimeSlot(e.target.value)}
                      className="w-full rounded-lg border border-border-sage bg-white px-3 py-2 text-sm"
                    >
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {formatTimeLabel(slot)}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-xs font-semibold text-ink-ghost">Notes</span>
                  <textarea
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    rows={2}
                    placeholder="e.g. Review progress, continue medication…"
                    className="w-full resize-none rounded-lg border border-border-sage bg-white px-3 py-2 text-sm"
                  />
                </label>
              </div>

              {appointment.followUpAddedBy?.name ? (
                <p className="mt-2 flex items-center gap-1 text-xs text-ink-ghost">
                  <UserRound className="h-3.5 w-3.5" />
                  Added by {appointment.followUpAddedBy.name}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => void handleSaveFollowUp()} disabled={submitting}>
                  Save follow-up
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    followUpDraft.saveDraft(followUpDraftPayload(), {
                      contextKey: appointmentId
                        ? draftContextKeys.appointment(appointmentId)
                        : 'unsaved',
                    });
                    showToast('Follow-up draft saved', 'success');
                  }}
                  disabled={submitting}
                >
                  Save draft
                </Button>
              </div>
            </div>

            {canCreatePrescription ? (
              <div className="rounded-2xl border border-border-sage bg-white p-4 shadow-sm">
                <h2 className="mb-3 font-serif text-base font-semibold text-ink">Prescription</h2>
                <PrescriptionEditor
                  patientCode={appointment.patientCode}
                  appointmentCode={appointment.appointmentCode}
                  compact
                />
              </div>
            ) : null}
          </div>

          <Button
            variant="secondary"
            onClick={() => navigate(patientDetailPath(appointment.patientCode))}
          >
            Back to patient
          </Button>
        </div>
      )}

      <ConfirmActionModal
        open={confirmOpen}
        title="Complete this visit?"
        message={`Record consultation fee ₹${consultationFee || profileFee || '0'} and mark visit as attended?`}
        confirmLabel="Complete visit"
        loading={submitting}
        onConfirm={() => void handleCompleteVisit()}
        onClose={() => !submitting && setConfirmOpen(false)}
      />
    </div>
  );
};

const InfoCell = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="rounded-lg bg-cream/50 px-2.5 py-2">
    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">{label}</p>
    <div className="mt-0.5 text-sm text-ink">{value}</div>
  </div>
);

export default AppointmentFollowUpPage;
