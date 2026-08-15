import type { AppointmentStats } from '@/types/appointment.types';

const buildStats = (input: AppointmentStats) => [
  {
    value: input.scheduledToday,
    label: 'Today Scheduled',
    accent: 'text-warning',
    dot: 'bg-warning',
  },
  {
    value: input.completed,
    label: 'Completed Today',
    accent: 'text-success',
    dot: 'bg-success',
  },
  {
    value: input.panchakarma,
    label: 'Panchakarma',
    accent: 'text-violet-600',
    dot: 'bg-violet-500',
  },
  {
    value: input.cancelled,
    label: 'Cancelled Today',
    accent: 'text-ink-ghost',
    dot: 'bg-ink-ghost',
  },
];

interface Props {
  stats: AppointmentStats;
}

export const AppointmentStatsCards = ({ stats }: Props) => (
  <div className="grid grid-cols-2 gap-2">
    {buildStats(stats).map((s) => (
      <div
        key={s.label}
        className="rounded-xl border border-border-sage bg-white px-3 py-2"
      >
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${s.dot}`} />
          <span className={`text-lg font-bold leading-none ${s.accent}`}>{s.value}</span>
        </div>
        <p className="mt-1 text-[10px] font-medium text-ink-soft">{s.label}</p>
      </div>
    ))}
  </div>
);
