import { Link } from 'react-router-dom';
import { appointmentDetailPath } from '@/constants/routes';
import type { Appointment, AppointmentStatus } from '@/pages/appointments/data/mockAppointments';

interface Props {
  appointment: Appointment;
}

const statusStyles: Record<AppointmentStatus, string> = {
  Soon: 'border-warning/40 bg-warning-bg text-warning',
  In: 'border-success/30 bg-success-bg text-success',
  Done: 'border-success/30 bg-success-bg text-success',
  Cancelled: 'border-border-sage bg-cream text-ink-ghost',
};

export const ScheduleListItem = ({ appointment }: Props) => {
  const { clock, period } = parseTime(appointment.time);
  const isCheckedIn = appointment.status === 'In';

  return (
    <Link
      to={appointmentDetailPath(appointment.id)}
      className={`flex h-[68px] shrink-0 cursor-pointer items-center gap-3 rounded-lg border border-border-sage bg-white px-3 transition-colors hover:border-sage-pale hover:bg-sage-mist/60 ${
        isCheckedIn
          ? 'border-l-[3px] border-l-sage-deep bg-sage-mist/30 pl-[calc(0.75rem-3px)]'
          : 'border-l-[3px] border-l-transparent hover:border-l-sage-deep'
      }`}
    >
      <div className="flex w-11 shrink-0 flex-col items-center text-center">
        <span className="text-xs font-bold leading-none text-ink">{clock}</span>
        {period ? (
          <span className="mt-0.5 text-[9px] font-semibold uppercase text-ink-ghost">
            {period}
          </span>
        ) : null}
      </div>

      <div className="h-8 w-px shrink-0 bg-border-sage" aria-hidden />

      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${appointment.avatarClass}`}
      >
        {appointment.initials}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{appointment.patientName}</p>
        <p className="truncate text-[11px] text-ink-soft">{appointment.type}</p>
      </div>

      <span
        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusStyles[appointment.status]}`}
      >
        {appointment.status}
      </span>
    </Link>
  );
};

const parseTime = (time: string) => {
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return {
    clock: `${hour}:${String(m).padStart(2, '0')}`,
    period,
  };
};
