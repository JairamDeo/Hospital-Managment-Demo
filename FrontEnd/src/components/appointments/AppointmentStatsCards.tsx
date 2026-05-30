import { APPOINTMENT_STATS } from '@/pages/appointments/data/mockAppointments';

const stats = [
  {
    value: APPOINTMENT_STATS.scheduledToday,
    label: 'Today Scheduled',
    accent: 'text-warning',
    dot: 'bg-warning',
  },
  {
    value: APPOINTMENT_STATS.completed,
    label: 'Completed',
    accent: 'text-success',
    dot: 'bg-success',
  },
  {
    value: APPOINTMENT_STATS.panchakarma,
    label: 'Panchakarma',
    accent: 'text-violet-600',
    dot: 'bg-violet-500',
  },
  {
    value: APPOINTMENT_STATS.cancelled,
    label: 'Cancelled Today',
    accent: 'text-ink-ghost',
    dot: 'bg-ink-ghost',
  },
];

export const AppointmentStatsCards = () => (
  <div className="grid grid-cols-2 gap-2">
    {stats.map((s) => (
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
