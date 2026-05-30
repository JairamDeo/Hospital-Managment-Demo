import type { StaffScheduleSlot } from '@/pages/staff/data/mockStaffDetails';

const STATUS_STYLES = {
  Upcoming: 'bg-blue-50 text-blue-700',
  'In Progress': 'bg-warning-bg text-warning',
  Completed: 'bg-success-bg text-success',
};

interface Props {
  slots: StaffScheduleSlot[];
}

export const StaffTodayScheduleCard = ({ slots }: Props) => (
  <div className="rounded-2xl border border-border-sage bg-white p-4 shadow-sm">
    <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
      Today&apos;s Schedule
    </h3>
    {slots.length === 0 ? (
      <p className="mt-3 text-sm text-ink-soft">No sessions scheduled today</p>
    ) : (
      <div className="mt-3 space-y-2">
        {slots.slice(0, 3).map((slot) => (
          <div
            key={slot.id}
            className="flex items-start justify-between gap-2 rounded-lg border border-border-sage/60 bg-cream/30 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink">{slot.time}</p>
              <p className="truncate text-sm text-ink-soft">{slot.title}</p>
              <p className="truncate text-xs text-ink-ghost">{slot.patientOrTask}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[slot.status]}`}
            >
              {slot.status === 'In Progress' ? 'Active' : slot.status}
            </span>
          </div>
        ))}
        {slots.length > 3 ? (
          <p className="pt-1 text-center text-[11px] font-medium text-sage-deep">
            +{slots.length - 3} more in Schedule tab
          </p>
        ) : null}
      </div>
    )}
  </div>
);
