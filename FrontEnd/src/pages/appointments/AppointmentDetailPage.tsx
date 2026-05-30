import { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { NewAppointmentModal } from '@/components/modals/NewAppointmentModal';
import { AppointmentProfileCard } from '@/components/appointments/detail/AppointmentProfileCard';
import { AppointmentDetailTabs } from '@/components/appointments/detail/AppointmentDetailTabs';
import { AppointmentVisitSummaryRow } from '@/components/appointments/detail/AppointmentVisitSummaryRow';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/constants/routes';
import { buildAppointmentDetail } from './data/mockAppointmentDetails';
import {
  MOCK_APPOINTMENTS,
  type AppointmentFormValues,
} from './data/mockAppointments';
import { MOCK_PATIENTS } from '@/pages/patients/data/mockPatients';

export const AppointmentDetailPage = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { showToast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS);

  const appointment = useMemo(() => {
    const base = appointments.find((a) => a.id === appointmentId);
    return base ? buildAppointmentDetail(base) : null;
  }, [appointmentId, appointments]);

  if (!appointmentId || !appointment) {
    return <Navigate to={ROUTES.APPOINTMENTS} replace />;
  }

  const formInitial: AppointmentFormValues = {
    patientId: appointment.patientId,
    type: appointment.type,
    date: appointment.date,
    time: appointment.time,
    notes: appointment.notes ?? '',
  };

  const handleEditSubmit = (values: AppointmentFormValues) => {
    const patient = MOCK_PATIENTS.find((p) => p.id === values.patientId);
    if (!patient) return;

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointment.id
          ? {
              ...a,
              patientId: patient.id,
              patientName: patient.name,
              initials: patient.initials,
              avatarClass: patient.avatarClass,
              type: values.type,
              date: values.date,
              time: values.time,
              notes: values.notes,
            }
          : a
      )
    );
    setEditOpen(false);
    showToast('Appointment updated successfully', 'success');
  };

  const handleCheckIn = () => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointment.id ? { ...a, status: 'In' as const } : a))
    );
    showToast(`${appointment.patientName} checked in`, 'success');
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] pb-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[300px] xl:w-[320px]">
          <AppointmentProfileCard
            appointment={appointment}
            onReschedule={() => showToast('Reschedule — coming soon', 'success')}
            onEdit={() => setEditOpen(true)}
            onCheckIn={handleCheckIn}
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

      <NewAppointmentModal
        key={`edit-${appointment.id}`}
        open={editOpen}
        initial={formInitial}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
};

export default AppointmentDetailPage;
