import { Clock, Star, TrendingUp, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { StaffMetrics } from '@/pages/staff/data/mockStaffDetails';

interface Props {
  metrics: StaffMetrics;
}

const METRIC_CONFIG: {
  key: keyof StaffMetrics;
  label: string;
  icon: LucideIcon;
  tone: string;
  format: (m: StaffMetrics) => string;
}[] = [
  {
    key: 'patientsToday',
    label: 'Today',
    icon: Users,
    tone: 'text-blue-600 bg-blue-50',
    format: (m) => String(m.patientsToday),
  },
  {
    key: 'totalHandled',
    label: 'Total Handled',
    icon: TrendingUp,
    tone: 'text-emerald-600 bg-emerald-50',
    format: (m) => String(m.totalHandled),
  },
  {
    key: 'rating',
    label: 'Rating',
    icon: Star,
    tone: 'text-amber-600 bg-amber-50',
    format: (m) => `${m.rating}★`,
  },
  {
    key: 'shiftHours',
    label: 'Shift Hours',
    icon: Clock,
    tone: 'text-violet-600 bg-violet-50',
    format: (m) => m.shiftHours,
  },
];

export const StaffMetricsRow = ({ metrics }: Props) => (
  <div className="grid grid-cols-4 gap-2 sm:gap-3">
    {METRIC_CONFIG.map(({ key, label, icon: Icon, tone, format }) => (
      <div
        key={key}
        className="min-w-0 rounded-2xl border border-border-sage bg-white px-2.5 py-3 shadow-sm sm:px-4"
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg sm:h-7 sm:w-7 ${tone}`}>
            <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.25} />
          </span>
          <span className="truncate text-[9px] font-bold uppercase tracking-wider text-ink-ghost sm:text-[10px]">
            {label}
          </span>
        </div>
        <p className="mt-1.5 truncate text-sm font-semibold text-ink sm:mt-2 sm:text-base">
          {format(metrics)}
        </p>
      </div>
    ))}
  </div>
);
