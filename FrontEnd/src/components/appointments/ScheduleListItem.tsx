import { Link } from 'react-router-dom';
import { CalendarCheck, Eye, Leaf } from 'lucide-react';
import { appointmentFollowUpPath, patientDetailPath } from '@/constants/routes';
import type { Appointment, AppointmentStatus } from '@/types/appointment.types';

interface Props {
  appointment: Appointment;
  canAttend?: boolean;
  canSchedulePanchakarma?: boolean;
  onSchedulePanchakarma?: (appointment: Appointment) => void;
}

const statusStyles: Record<AppointmentStatus, string> = {
  Soon: 'border-warning/40 bg-warning-bg text-warning',
  In: 'border-success/30 bg-success-bg text-success',
  Done: 'border-success/30 bg-success-bg text-success',
  Cancelled: 'border-border-sage bg-cream text-ink-ghost',
};

const statusLabels: Record<AppointmentStatus, string> = {
  Soon: 'Pending',
  In: 'Checked in',
  Done: 'Done',
  Cancelled: 'Cancelled',
};

export const ScheduleListItem = ({
  appointment,
  canAttend = false,
  canSchedulePanchakarma = false,
  onSchedulePanchakarma,
}: Props) => {
  const { clock, period } = parseTime(appointment.time);
  const isCheckedIn = appointment.status === 'In';
  const showAttend =
    canAttend && (appointment.status === 'Soon' || appointment.status === 'In');
  const showPanchakarma =
    canSchedulePanchakarma &&
    appointment.status !== 'Cancelled' &&
    onSchedulePanchakarma;

  return (
    <div
      className={`flex shrink-0 items-center gap-2 rounded-lg border border-border-sage bg-white px-2.5 py-2 transition-colors hover:border-sage-pale hover:bg-sage-mist/40 ${
        isCheckedIn
          ? 'border-l-[3px] border-l-sage-deep bg-sage-mist/30 pl-[calc(0.625rem-3px)]'
          : 'border-l-[3px] border-l-transparent hover:border-l-sage-deep'
      }`}
    >
      <div className="flex w-10 shrink-0 flex-col items-center text-center">
        <span className="text-[11px] font-bold leading-none text-ink">{clock}</span>
        {period ? (
          <span className="mt-0.5 text-[8px] font-semibold uppercase text-ink-ghost">
            {period}
          </span>
        ) : null}
      </div>

      <div className="h-7 w-px shrink-0 bg-border-sage" aria-hidden />

      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${appointment.avatarClass}`}
      >
        {appointment.initials}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{appointment.patientName}</p>
        <p className="truncate text-[10px] text-ink-soft">
          {appointment.type} · {appointment.id}
        </p>
      </div>

      <span
        className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${statusStyles[appointment.status]}`}
      >
        {statusLabels[appointment.status]}
      </span>

      <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
        <Link
          to={patientDetailPath(appointment.patientId)}
          state={{ activeTab: 'appointments' as const }}
          className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-border-sage bg-white px-2 py-1 text-[10px] font-semibold text-ink-soft hover:bg-sage-mist/60 hover:text-ink"
        >
          <Eye className="h-3 w-3" />
          View
        </Link>
        {showAttend ? (
          <Link
            to={appointmentFollowUpPath(appointment.id)}
            className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg bg-sage-deep px-2 py-1 text-[10px] font-semibold text-white hover:bg-sage-deep/90"
          >
            <CalendarCheck className="h-3 w-3" />
            Attend
          </Link>
        ) : null}
        {showPanchakarma ? (
          <button
            type="button"
            onClick={() => onSchedulePanchakarma(appointment)}
            className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-sage-deep/40 bg-sage-mist/50 px-2 py-1 text-[10px] font-semibold text-sage-deep hover:bg-sage-mist"
          >
            <Leaf className="h-3 w-3" />
            <span className="hidden min-[420px]:inline">Panchakarma</span>
            <span className="min-[420px]:hidden">PK</span>
          </button>
        ) : null}
      </div>
    </div>
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
