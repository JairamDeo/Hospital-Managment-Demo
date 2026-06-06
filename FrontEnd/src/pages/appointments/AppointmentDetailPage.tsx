import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { NewAppointmentModal } from '@/components/modals/NewAppointmentModal';
import { AppointmentProfileCard } from '@/components/appointments/detail/AppointmentProfileCard';
import { AppointmentDetailTabs } from '@/components/appointments/detail/AppointmentDetailTabs';
import { AppointmentVisitSummaryRow } from '@/components/appointments/detail/AppointmentVisitSummaryRow';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/hooks/usePermissions';
import { ROUTES } from '@/constants/routes';
import { appointmentAdminService } from '@/services/appointment/appointmentAdmin.service';
import { buildAppointmentDetail, hmsToAppointment } from '@/utils/appointmentHelpers';
import { getApiErrorMessage } from '@/utils/helpers';
import { useAdminPatientsList } from '@/hooks/useAdminPatientsList';
import type { AppointmentFormValues, AppointmentDoctor } from '@/types/appointment.types';
import type { AppointmentDetail } from '@/types/appointmentDetail.types';

export const AppointmentDetailPage = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { patients } = useAdminPatientsList();
  const { showToast } = useToast();
  const { canEdit } = usePermissions();
  const [editOpen, setEditOpen] = useState(false);
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<AppointmentDoctor[]>([]);

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
        if (!cancelled) setAppointment(buildAppointmentDetail(base, patient));
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
    appointmentAdminService
      .listDoctors()
      .then((res) => setDoctors(res.data.res?.doctors ?? []))
      .catch(() => setDoctors([]));
    return () => {
      cancelled = true;
    };
  }, [appointmentId, patients, showToast]);

  if (!appointmentId) {
    return <Navigate to={ROUTES.ADMIN_APPOINTMENTS} replace />;
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1280px] py-16 text-center text-sm text-ink-soft">
        Loading appointment…
      </div>
    );
  }

  if (!appointment) {
    return <Navigate to={ROUTES.ADMIN_APPOINTMENTS} replace />;
  }

  const formInitial: AppointmentFormValues = {
    patientId: appointment.patientId,
    staffCode: appointment.staffCode,
    type: appointment.type,
    date: appointment.date,
    time: appointment.time,
    notes: appointment.notes ?? '',
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] pb-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[300px] xl:w-[320px]">
          <AppointmentProfileCard
            appointment={appointment}
            onReschedule={() => showToast('Reschedule — coming soon', 'success')}
            onEdit={canEdit('appointments') ? () => setEditOpen(true) : undefined}
          />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-5">
          <AppointmentDetailTabs appointment={appointment} />
          <div>
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
              Visit Summary
            </h3>
            <AppointmentVisitSummaryRow appointment={appointment} />
          </div>
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
            showToast('Appointment update — coming soon', 'success');
          }}
        />
      ) : null}
    </div>
  );
};

export default AppointmentDetailPage;
