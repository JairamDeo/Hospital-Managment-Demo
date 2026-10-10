import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ContentLoader } from '@/components/ui/Loader';
import { PrescriptionEditor } from '@/components/prescriptions/PrescriptionEditor';
import { appointmentAdminService } from '@/services/appointment/appointmentAdmin.service';
import { useToast } from '@/hooks/useToast';
import { useFormDraft } from '@/hooks/useFormDraft';
import { FormDraftPanel } from '@/components/ui/FormDraftPanel';
import { FORM_DRAFT_CATEGORIES, draftContextKeys } from '@/store/formDraftStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { getApiErrorMessage } from '@/utils/helpers';
import { formatDateLabel, formatTimeLabel } from '@/utils/appointmentHelpers';
import { ROUTES, patientDetailPath } from '@/constants/routes';
import type { HmsAppointment } from '@/types/api.types';

interface FollowUpDraft {
  appointmentCode: string;
  patientName: string;
  followUpDate: string;
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
  const { isAdmin, isStaff, staffRole, staffCode, canEdit, canCreatePrescription } =
    usePermissions();
  const [appointment, setAppointment] = useState<HmsAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTimeSlot, setFollowUpTimeSlot] = useState('10:30');

  const canAttendVisit = useCallback(
    (row: HmsAppointment) => {
      if (!canEdit('appointments')) return false;
      if (isAdmin) return true;
      if (!isStaff) return false;
      if (staffRole === 'Support') return true;
      if (staffRole === 'Doctor' && staffCode && row.staffCode === staffCode) return true;
      return false;
    },
    [canEdit, isAdmin, isStaff, staffRole, staffCode]
  );

  const buildFollowUpDraftLabel = useCallback((draft: FollowUpDraft) => {
    const parts = [draft.patientName || 'Patient', draft.appointmentCode];
    if (draft.followUpDate) parts.push(`follow-up ${draft.followUpDate}`);
    return parts.join(' · ');
  }, []);

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
    return row;
  }, [appointmentId]);

  const canManage = useMemo(() => {
    if (!appointment) return false;
    return canAttendVisit(appointment);
  }, [appointment, canAttendVisit]);

  useEffect(() => {
    if (!appointmentId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        await loadAppointment();
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

  if (!appointmentId) {
    return <Navigate to={ROUTES.ADMIN_APPOINTMENTS} replace />;
  }

  if (loading) {
    return <ContentLoader size="lg" className="min-h-[50vh]" />;
  }

  if (!appointment) {
    return <Navigate to={ROUTES.ADMIN_APPOINTMENTS} replace />;
  }

  const isCompleted = appointment.status === 'Completed';
  const isCancelled = appointment.status === 'Cancelled';
  const isPending = appointment.status === 'Upcoming';
  const patientViewUrl = `${patientDetailPath(appointment.patientCode)}?tab=prescriptions`;

  const followUpDraftPayload = (): FollowUpDraft => ({
    appointmentCode: appointment.appointmentCode ?? appointmentId ?? '',
    patientName: appointment.patientName ?? '',
    followUpDate,
  });

  const applyFollowUpDraft = (draft: FollowUpDraft) => {
    setFollowUpDate(draft.followUpDate);
  };

  /** Mark visit complete only when doctor intentionally saves work */
  const completeVisit = async (opts?: { followUp?: boolean }) => {
    const { data } = await appointmentAdminService.attend(appointmentId, {
      followUpDate: opts?.followUp && followUpDate ? followUpDate : undefined,
      followUpTimeSlot:
        opts?.followUp && followUpDate ? followUpTimeSlot : undefined,
    });
    if (data.res?.appointment) {
      setAppointment(data.res.appointment);
    }
    return data.res?.appointment;
  };

  const handleSaveFollowUp = async () => {
    setSubmitting(true);
    try {
      await completeVisit({ followUp: true });
      followUpDraft.clearDraftAfterSubmit(
        appointmentId ? draftContextKeys.appointment(appointmentId) : undefined
      );
      if (followUpDate) {
        showToast('Follow-up date saved', 'success');
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrescriptionSaved = async () => {
    const goToPatient = () => {
      navigate(patientDetailPath(appointment.patientCode), {
        state: { activeTab: 'prescriptions' as const },
      });
    };
    try {
      if (isPending) {
        await completeVisit({ followUp: Boolean(followUpDate) });
      } else if (followUpDate) {
        await handleSaveFollowUp();
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      goToPatient();
    }
  };

  const handleMarkCompleteOnly = async () => {
    if (!confirm('Mark this visit as complete without a prescription?')) return;
    setSubmitting(true);
    try {
      await completeVisit({ followUp: Boolean(followUpDate) });
      showToast('Visit marked complete', 'success');
      navigate(patientDetailPath(appointment.patientCode), {
        state: { activeTab: 'appointments' as const },
      });
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl pb-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">Visit</p>
          <h1 className="font-serif text-[1.85rem] font-bold leading-tight text-sage-deep sm:text-3xl">
            Prescription
            <span className="font-normal text-ink-soft"> — </span>
            <a
              href={patientViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-sage-deep hover:underline"
            >
              {appointment.patientName}
            </a>
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {formatDateLabel(appointment.date)} · {formatTimeLabel(appointment.time)}
            {appointment.doctorName ? ` · ${appointment.doctorName}` : ''}
          </p>
          {isPending ? (
            <p className="mt-2 inline-flex rounded-full border border-warning/40 bg-warning-bg px-2.5 py-0.5 text-[11px] font-semibold text-warning">
              Pending — not marked done until you save
            </p>
          ) : isCompleted ? (
            <p className="mt-2 inline-flex rounded-full border border-success/30 bg-success-bg px-2.5 py-0.5 text-[11px] font-semibold text-success">
              Visit completed
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border-sage bg-white px-3 py-2 text-sm shadow-sm">
          <CalendarCheck className="h-4 w-4 text-sage-deep" />
          <span className="font-semibold text-ink">{appointment.appointmentCode}</span>
        </div>
      </div>

      {isCancelled ? (
        <p className="rounded-xl border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
          This appointment was cancelled and cannot be marked as attended.
        </p>
      ) : !canManage ? (
        <p className="text-sm text-ink-soft">You do not have permission to update this visit.</p>
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

          {canCreatePrescription ? (
            <div className="rounded-2xl border border-border-sage bg-white p-4 shadow-sm sm:p-5">
              <PrescriptionEditor
                patientCode={appointment.patientCode}
                appointmentCode={appointment.appointmentCode}
                onSaved={() => {
                  void handlePrescriptionSaved();
                }}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-border-sage bg-white px-4 py-4 text-sm text-ink-soft">
              <p>You do not have permission to write a prescription.</p>
              {isPending ? (
                <Button
                  className="mt-3"
                  onClick={() => void handleMarkCompleteOnly()}
                  disabled={submitting}
                >
                  Mark visit complete
                </Button>
              ) : null}
            </div>
          )}

          <div className="rounded-2xl border border-border-sage bg-white p-4 shadow-sm">
            <label className="block max-w-sm">
              <span className="mb-1 block text-xs font-semibold text-ink-ghost">
                Follow-up date <span className="font-normal text-ink-soft">(optional)</span>
              </span>
              <div className="mb-2 flex flex-wrap gap-1.5">
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
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-lg border border-border-sage bg-white px-3 py-2 text-sm"
              />
            </label>
            <p className="mt-2 text-xs text-ink-soft">
              Patient receives an SMS/WhatsApp reminder 1 hour before the slot.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {followUpDate && isCompleted ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void handleSaveFollowUp()}
                  disabled={submitting}
                >
                  Save follow-up date
                </Button>
              ) : null}
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
                Save as draft
              </Button>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={() => navigate(patientDetailPath(appointment.patientCode))}
          >
            Back to patient
          </Button>
        </div>
      )}
    </div>
  );
};

export default AppointmentFollowUpPage;
