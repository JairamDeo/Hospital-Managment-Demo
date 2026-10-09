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
          {typeLabel} · {appointment.id}
        </p>
      </div>

      <span
        className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${statusStyles[appointment.status]}`}
      >
        {statusLabels[appointment.status]}
      </span>

      <div className="flex shrink-0 flex-wrap justify-end gap-1">
        <Link
          to={patientDetailPath(appointment.patientId)}
          state={{ activeTab: 'appointments' as const }}
          className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-border-sage bg-white px-2 py-1 text-[10px] font-semibold text-ink-soft hover:bg-sage-mist/60 hover:text-ink"
        >
          <Eye className="h-3 w-3" strokeWidth={2.5} />
          View
        </Link>
        {showAttend ? (
          <Link
            to={appointmentFollowUpPath(appointment.id)}
            className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg bg-sage-deep px-2 py-1 text-[10px] font-semibold text-white hover:bg-sage-deep/90"
          >
            <CalendarCheck className="h-3 w-3" strokeWidth={2.5} />
            Attend
          </Link>
        ) : null}
        {showManageActions && onReschedule ? (
          <button
            type="button"
            onClick={() => onReschedule(appointment)}
            className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-border-sage bg-white px-2 py-1 text-[10px] font-semibold text-ink-soft hover:bg-sage-mist"
          >
            <CalendarClock className="h-3 w-3" strokeWidth={2.5} />
            Reschedule
          </button>
        ) : null}
        {showManageActions && onCancel ? (
          <button
            type="button"
            onClick={() => onCancel(appointment)}
            className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-danger/30 bg-white px-2 py-1 text-[10px] font-semibold text-danger hover:bg-danger-bg"
          >
            <XCircle className="h-3 w-3" strokeWidth={2.5} />
            Cancel
          </button>
        ) : null}
        {showPanchakarma ? (
          <button
            type="button"
            onClick={() => onSchedulePanchakarma(appointment)}
            className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-sage-deep/40 bg-sage-mist/50 px-2 py-1 text-[10px] font-semibold text-sage-deep hover:bg-sage-mist"
          >
            <Leaf className="h-3 w-3" strokeWidth={2.5} />
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
