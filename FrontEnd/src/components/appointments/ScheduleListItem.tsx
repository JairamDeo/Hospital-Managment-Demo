import { Link } from 'react-router-dom';
import { CalendarCheck, CalendarClock, Eye, Leaf, XCircle } from 'lucide-react';
import { appointmentFollowUpPath, patientDetailPath } from '@/constants/routes';
import type { Appointment, AppointmentStatus } from '@/types/appointment.types';

interface Props {
  appointment: Appointment;
  canAttend?: boolean;
  canManage?: boolean;
  canSchedulePanchakarma?: boolean;
  onSchedulePanchakarma?: (appointment: Appointment) => void;
  onReschedule?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
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

const actionBtnBase =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors';

export const ScheduleListItem = ({
  appointment,
  canAttend = false,
  canManage = false,
  canSchedulePanchakarma = false,
  onSchedulePanchakarma,
  onReschedule,
  onCancel,
}: Props) => {
  const { clock, period } = parseTime(appointment.time);
  const isCheckedIn = appointment.status === 'In';
  const showAttend =
    canAttend && (appointment.status === 'Soon' || appointment.status === 'In');
  const showManageActions =
    canManage && (appointment.status === 'Soon' || appointment.status === 'In');
  const showPanchakarma =
    canSchedulePanchakarma &&
    appointment.status !== 'Cancelled' &&
    onSchedulePanchakarma;

  const modeLabel = appointment.consultationMode || 'Offline';
  const typeLabel =
    appointment.type === 'General Consult' ? modeLabel : `${appointment.type} · ${modeLabel}`;

  return (
    <div
      className={`flex shrink-0 flex-col gap-3 rounded-xl border border-border-sage bg-white px-3.5 py-3 transition-colors hover:border-sage-pale hover:bg-sage-mist/30 sm:flex-row sm:items-center sm:gap-3 ${
        isCheckedIn
          ? 'border-l-[3px] border-l-sage-deep bg-sage-mist/25 pl-[calc(0.875rem-3px)]'
          : 'border-l-[3px] border-l-transparent hover:border-l-sage-deep'
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex w-12 shrink-0 flex-col items-center text-center">
          <span className="text-sm font-bold leading-none text-ink">{clock}</span>
          {period ? (
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-ink-ghost">
              {period}
            </span>
          ) : null}
        </div>

        <div className="h-9 w-px shrink-0 bg-border-sage" aria-hidden />

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${appointment.avatarClass}`}
        >
          {appointment.initials}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink sm:text-[15px]">
            {appointment.patientName}
          </p>
          <p className="truncate text-xs text-ink-soft">
            {typeLabel} · {appointment.id}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyles[appointment.status]}`}
        >
          {statusLabels[appointment.status]}
        </span>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
        <Link
          to={patientDetailPath(appointment.patientId)}
          state={{ activeTab: 'appointments' as const }}
          className={`${actionBtnBase} border border-border-sage bg-white text-ink-soft hover:bg-sage-mist/60 hover:text-ink`}
        >
          <Eye className="h-3.5 w-3.5" strokeWidth={2.5} />
          View
        </Link>
        {showAttend ? (
          <Link
            to={appointmentFollowUpPath(appointment.id)}
            className={`${actionBtnBase} bg-sage-deep text-white hover:bg-sage-deep/90`}
          >
            <CalendarCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
            Attend
          </Link>
        ) : null}
        {showManageActions && onReschedule ? (
          <button
            type="button"
            onClick={() => onReschedule(appointment)}
            className={`${actionBtnBase} border border-border-sage bg-white text-ink-soft hover:bg-sage-mist`}
          >
            <CalendarClock className="h-3.5 w-3.5" strokeWidth={2.5} />
            Reschedule
          </button>
        ) : null}
        {showManageActions && onCancel ? (
          <button
            type="button"
            onClick={() => onCancel(appointment)}
            className={`${actionBtnBase} border border-danger/30 bg-white text-danger hover:bg-danger-bg`}
          >
            <XCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
            Cancel
          </button>
        ) : null}
        {showPanchakarma ? (
          <button
            type="button"
            onClick={() => onSchedulePanchakarma(appointment)}
            className={`${actionBtnBase} border border-sage-deep/40 bg-sage-mist/50 text-sage-deep hover:bg-sage-mist`}
          >
            <Leaf className="h-3.5 w-3.5" strokeWidth={2.5} />
            <span className="hidden min-[420px]:inline">Panchakarma</span>
            <span className="min-[420px]:hidden">PK</span>
          </button>
        ) : null}
      </div>
    </div>
  );
};

const parseTime = (time: string) => {
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) {
    return { clock: time, period: '' };
  }
  const hour = parseInt(match[1], 10);
  const minute = match[2];
  const period = (match[3] || '').toUpperCase();
  return {
    clock: `${hour}:${minute}`,
    period,
  };
};
