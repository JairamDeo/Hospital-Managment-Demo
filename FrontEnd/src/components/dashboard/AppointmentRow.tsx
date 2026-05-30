import { Link } from 'react-router-dom';
import { appointmentDetailPath } from '@/constants/routes';

interface AppointmentRowProps {
  appointmentId: string;
  time: string;
  name: string;
  type: string;
  status: 'Upcoming' | 'Checked In';
  initials: string;
  avatarClass: string;
}

const parseTime = (time: string) => {
  const parts = time.trim().split(' ');
  if (parts.length >= 2) {
    return { clock: parts[0], period: parts[1] };
  }
  return { clock: time, period: '' };
};

export const AppointmentRow = ({
  appointmentId,
  time,
  name,
  type,
  status,
  initials,
  avatarClass,
}: AppointmentRowProps) => {
  const { clock, period } = parseTime(time);
  const isCheckedIn = status === 'Checked In';

  return (
    <Link
      to={appointmentDetailPath(appointmentId)}
      className={`group flex h-[60px] shrink-0 cursor-pointer items-center gap-3 rounded-lg border border-border-sage bg-white px-3 transition-all duration-200 hover:border-sage-pale hover:bg-sage-mist/70 active:bg-sage-mist ${
        isCheckedIn
          ? 'border-l-[3px] border-l-sage-deep bg-sage-mist/50 pl-[calc(0.75rem-3px)]'
          : 'border-l-[3px] border-l-transparent hover:border-l-sage-deep'
      }`}
    >
      <div className="flex w-12 shrink-0 flex-col items-center text-center">
        <span className="text-xs font-bold leading-none text-ink">{clock}</span>
        {period ? (
          <span className="mt-0.5 text-[9px] font-semibold uppercase text-ink-ghost">
            {period}
          </span>
        ) : null}
      </div>

      <div className="h-8 w-px shrink-0 bg-border-sage" aria-hidden />

      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${avatarClass}`}
      >
        {initials}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{name}</p>
        <p className="truncate text-[11px] text-ink-soft">{type}</p>
      </div>

      <span
        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
          isCheckedIn
            ? 'border-success/30 bg-success-bg text-success'
            : 'border-warning/40 bg-warning-bg text-warning'
        }`}
      >
        {status}
      </span>
    </Link>
  );
};
