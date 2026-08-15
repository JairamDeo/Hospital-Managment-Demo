import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, History } from 'lucide-react';
import { CustomerBookAppointmentCard } from '@/components/customer/CustomerBookAppointmentCard';
import { AppointmentPayButton } from '@/components/customer/AppointmentPayButton';
import { usePatientPortalAuth } from '@/hooks/usePatientPortalAuth';
import { useToast } from '@/hooks/useToast';
import { patientPortalAppointmentService } from '@/services/appointment/patientPortalAppointment.service';
import { getApiErrorMessage } from '@/utils/helpers';
import type { HmsAppointment } from '@/types/api.types';
import { formatTimeLabel } from '@/utils/appointmentHelpers';

const statusClass: Record<HmsAppointment['status'], string> = {
  Upcoming: 'bg-sage-pale text-sage-deep',
  Completed: 'bg-cream text-ink-soft',
  Cancelled: 'bg-danger-bg text-danger',
};

const AppointmentRow = ({
  appointment,
  patientName,
  onPaid,
}: {
  appointment: HmsAppointment;
  patientName: string;
  onPaid: (updated: HmsAppointment) => void;
}) => (
  <li className="rounded-xl border border-border-sage/80 bg-cream/30 px-3 py-3">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">
          {appointment.appointmentType ?? appointment.type}
        </p>
        <p className="mt-0.5 text-xs text-ink-soft">
          Dr. {appointment.doctorName}
        </p>
        <p className="mt-1 text-xs text-ink-ghost">
          {appointment.dateDisplay ?? appointment.date} ·{' '}
          {appointment.timeDisplay ?? formatTimeLabel(appointment.time)}
        </p>
        {appointment.paymentStatus === 'unpaid' && (appointment.consultationFeeExpected ?? 0) > 0 ? (
          <p className="mt-1 text-xs font-medium text-amber-800">
            Fee pending · ₹{appointment.consultationFeeExpected}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusClass[appointment.status]}`}
        >
          {appointment.status}
        </span>
        {appointment.status === 'Upcoming' ? (
          <AppointmentPayButton
            appointment={appointment}
            patientName={patientName}
            onPaid={onPaid}
            compact
          />
        ) : appointment.paymentStatus === 'paid' ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
            Paid
          </span>
        ) : null}
      </div>
    </div>
  </li>
);

export const CustomerAppointmentsPage = () => {
  const { showToast } = useToast();
  const { patient } = usePatientPortalAuth();
  const [appointments, setAppointments] = useState<HmsAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const patientName = patient?.name || 'Patient';

  const patchAppointment = useCallback((updated: HmsAppointment) => {
    setAppointments((prev) =>
      prev.map((a) => (a.appointmentCode === updated.appointmentCode ? updated : a))
    );
  }, []);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await patientPortalAppointmentService.listMine();
      setAppointments(data.res?.appointments ?? []);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const upcoming = useMemo(
    () =>
      [...appointments]
        .filter((a) => a.status === 'Upcoming')
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    [appointments]
  );

  const past = useMemo(
    () =>
      [...appointments]
        .filter((a) => a.status !== 'Upcoming')
        .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)),
    [appointments]
  );

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border-sage bg-gradient-to-br from-sage-mist/80 to-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-sage-deep" strokeWidth={1.75} />
          <h1 className="font-serif text-xl font-semibold text-ink">Appointments</h1>
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          Book a new visit or review your appointment history.
        </p>
      </div>

      <CustomerBookAppointmentCard onBooked={loadAppointments} />

      <div className="rounded-2xl border border-border-sage bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <History className="h-4 w-4 text-sage-deep" strokeWidth={1.75} />
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
            Upcoming visits
          </h2>
        </div>
        {loading ? (
          <p className="text-sm text-ink-soft">Loading appointments…</p>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-ink-ghost">No upcoming appointments.</p>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((a) => (
              <AppointmentRow
                key={a.id}
                appointment={a}
                patientName={patientName}
                onPaid={patchAppointment}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-border-sage bg-white p-5 shadow-sm">
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
          Previous appointments
        </h2>
        {loading ? (
          <p className="mt-3 text-sm text-ink-soft">Loading history…</p>
        ) : past.length === 0 ? (
          <p className="mt-3 text-sm text-ink-ghost">No previous appointments yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {past.map((a) => (
              <AppointmentRow
                key={a.id}
                appointment={a}
                patientName={patientName}
                onPaid={patchAppointment}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CustomerAppointmentsPage;
