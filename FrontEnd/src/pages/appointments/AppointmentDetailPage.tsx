import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Save } from 'lucide-react';
import { NewAppointmentModal } from '@/components/modals/NewAppointmentModal';
import { AppointmentProfileCard } from '@/components/appointments/detail/AppointmentProfileCard';
import { AppointmentDetailTabs } from '@/components/appointments/detail/AppointmentDetailTabs';
import type { VisitClinicalForm } from '@/components/appointments/detail/tabs/AppointmentTabPanels';
import { Button } from '@/components/ui/Button';
import { ContentLoader } from '@/components/ui/Loader';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/hooks/usePermissions';
import { appointmentFollowUpPath, ROUTES } from '@/constants/routes';
import { appointmentAdminService } from '@/services/appointment/appointmentAdmin.service';
import { patientAdminService } from '@/services/patient/patientAdmin.service';
import { buildAppointmentDetail, hmsToAppointment } from '@/utils/appointmentHelpers';
import { getApiErrorMessage } from '@/utils/helpers';
import { useAdminPatientsList } from '@/hooks/useAdminPatientsList';
import type { AppointmentFormValues, AppointmentDoctor } from '@/types/appointment.types';
import type { AppointmentDetail } from '@/types/appointmentDetail.types';
import type { HmsAppointment } from '@/types/api.types';

const formFromRow = (row: HmsAppointment, detail: AppointmentDetail): VisitClinicalForm => ({
  chiefComplaint: row.chiefComplaint?.trim() || detail.chiefComplaint || '',
  symptoms: row.symptoms?.trim() || detail.symptomsText || '',
  diagnosis: row.diagnosis?.trim() || detail.diagnosis || '',
  staffCode: row.staffCode || detail.staffCode,
  visitVitals: {
    temp: row.visitVitals?.temp || '',
    bp: row.visitVitals?.bp || '',
    pulse: row.visitVitals?.pulse || '',
    spo2: row.visitVitals?.spo2 || '',
    weight: row.visitVitals?.weight || '',
  },
});

export const AppointmentDetailPage = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { patients } = useAdminPatientsList();
  const { showToast } = useToast();
  const { canEdit, isStaff, staffRole } = usePermissions();
  const [editOpen, setEditOpen] = useState(false);
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<AppointmentDoctor[]>([]);
  const [form, setForm] = useState<VisitClinicalForm | null>(null);
  const [errors, setErrors] = useState<{ chiefComplaint?: string }>({});
  const [saving, setSaving] = useState(false);
  const [vitalsEditing, setVitalsEditing] = useState(false);

  const canEditVisit =
    canEdit('appointments') &&
    appointment?.status !== 'Cancelled' &&
    appointment?.status !== 'Done';

  useEffect(() => {
    if (!appointmentId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const { data } = await appointmentAdminService.get(appointmentId);
        const row = data.res?.appointment;
        if (!row) throw new Error('Appointment not found');
        const base = hmsToAppointment(row);
        const patient = patients.find((p) => p.id === base.patientId);
        const detail = buildAppointmentDetail(base, patient, row);
        if (!cancelled) {
          setAppointment(detail);
          setForm(formFromRow(row, detail));
          const hasVitals = Boolean(
            row.visitVitals?.temp ||
              row.visitVitals?.bp ||
              row.visitVitals?.pulse ||
              row.visitVitals?.spo2 ||
              row.visitVitals?.weight
          );
          setVitalsEditing(!hasVitals && detail.status !== 'Done' && detail.status !== 'Cancelled');
        }
      } catch (err) {
        if (!cancelled) {
          showToast(getApiErrorMessage(err), 'error');
          setAppointment(null);
          setForm(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    appointmentAdminService
      .listDoctors()
      .then((res) => setDoctors(res.data.res?.doctors ?? []))
      .catch(() => setDoctors([]));
    return () => {
      cancelled = true;
    };
  }, [appointmentId, patients, showToast]);

  const patchForm = (patch: Partial<VisitClinicalForm>) => {
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));
    if (patch.chiefComplaint !== undefined) {
      setErrors((e) => ({ ...e, chiefComplaint: undefined }));
    }
  };

  const persistVisit = async () => {
    if (!appointmentId || !form || !appointment) return null;
    const chief = form.chiefComplaint.trim();
    if (!chief) {
      setErrors({ chiefComplaint: 'Chief complaint is required' });
      showToast('Chief complaint is required', 'error');
      return null;
    }

    const { data } = await appointmentAdminService.saveVisitClinical(appointmentId, {
      chiefComplaint: chief,
      symptoms: form.symptoms.trim(),
      diagnosis: form.diagnosis.trim(),
      staffCode:
        !isStaff || staffRole !== 'Doctor' ? form.staffCode || undefined : undefined,
      visitVitals: form.visitVitals,
    });

    const row = data.res?.appointment;
    if (!row) throw new Error('Save failed');

    const vitalsPayload = form.visitVitals;
    const hasAnyVital = Object.values(vitalsPayload).some((v) => v?.trim());
    if (hasAnyVital) {
      await patientAdminService
        .addVitals(row.patientCode ?? appointment.patientId, {
          temp: vitalsPayload.temp,
          bp: vitalsPayload.bp,
          pulse: vitalsPayload.pulse,
          spo2: vitalsPayload.spo2,
          weight: vitalsPayload.weight,
        })
        .catch(() => undefined);
    }

    const base = hmsToAppointment(row);
    const patient = patients.find((p) => p.id === base.patientId);
    const detail = buildAppointmentDetail(base, patient, row);
    setAppointment(detail);
    setForm(formFromRow(row, detail));
    setVitalsEditing(false);
    return row;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const row = await persistVisit();
      if (row) showToast('Visit details saved', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = async () => {
    setSaving(true);
    try {
      const row = await persistVisit();
      if (!row) return;
      showToast('Continuing to prescription…', 'success');
      navigate(appointmentFollowUpPath(row.appointmentCode || appointmentId!));
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!appointmentId) {
    return <Navigate to={ROUTES.ADMIN_APPOINTMENTS} replace />;
  }

  if (loading || !form) {
    return <ContentLoader size="lg" className="min-h-[50vh]" />;
  }

  if (!appointment) {
    return <Navigate to={ROUTES.ADMIN_APPOINTMENTS} replace />;
  }

  const formInitial: AppointmentFormValues = {
    patientId: appointment.patientId,
    staffCode: appointment.staffCode,
    type: appointment.type,
    consultationMode: appointment.consultationMode || 'Offline',
    date: appointment.date,
    time: appointment.time,
    notes: appointment.notes ?? '',
  };

  const canChangeDoctor = canEditVisit && (!isStaff || staffRole !== 'Doctor');

  return (
    <div className="mx-auto w-full max-w-[1280px] pb-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[300px] xl:w-[320px]">
          <AppointmentProfileCard
            appointment={appointment}
            onReschedule={() => showToast('Use Reschedule from the appointments list', 'success')}
            onEdit={canEdit('appointments') ? () => setEditOpen(true) : undefined}
          />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-5">
          <AppointmentDetailTabs
            appointment={appointment}
            form={form}
            doctors={doctors}
            canEdit={canEditVisit}
            canChangeDoctor={canChangeDoctor}
            errors={errors}
            vitalsEditing={vitalsEditing && canEditVisit}
            onVitalsEditingChange={setVitalsEditing}
            onChange={patchForm}
          />

          {canEditVisit ? (
            <div className="sticky bottom-3 z-10 flex flex-col gap-2 rounded-xl border border-border-sage bg-white/95 p-3 shadow-md backdrop-blur sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                className="gap-2 rounded-xl"
                disabled={saving}
                onClick={() => void handleSave()}
              >
                <Save className="h-4 w-4" strokeWidth={2} />
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button
                className="gap-2 rounded-xl"
                disabled={saving}
                onClick={() => void handleContinue()}
              >
                Continue Patient Attend
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Button>
            </div>
          ) : null}
        </section>
      </div>

      {canEdit('appointments') ? (
        <NewAppointmentModal
          key={`edit-${appointment.id}`}
          open={editOpen}
          initial={formInitial}
          patients={patients}
          doctors={doctors}
          onClose={() => setEditOpen(false)}
          onSubmit={() => {
            setEditOpen(false);
            showToast('Use Reschedule to change date/time', 'success');
          }}
        />
      ) : null}
    </div>
  );
};

export default AppointmentDetailPage;
