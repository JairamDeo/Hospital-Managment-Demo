import { Building2, Stethoscope, UserRound } from 'lucide-react';
import type { StaffFilter, StaffStats } from '@/types/staff.types';
import { defaultStaffStats } from '@/utils/staffHelpers';

const buildFilters = (stats: StaffStats) => [
  {
    id: 'doctor' as const,
    label: 'Doctors',
    count: stats.doctors,
    icon: Stethoscope,
    iconClass: 'bg-violet-100 text-violet-600',
  },
  {
    id: 'therapist' as const,
    label: 'Therapists',
    count: stats.therapists,
    icon: UserRound,
    iconClass: 'bg-pink-100 text-pink-600',
  },
  {
    id: 'support' as const,
    label: 'Support Staff',
    count: stats.support,
    icon: Building2,
    iconClass: 'bg-teal-100 text-teal-700',
  },
];

interface Props {
  active: StaffFilter;
  stats?: StaffStats;
  onChange: (filter: StaffFilter) => void;
}

export const StaffRoleFilters = ({ active, stats, onChange }: Props) => {
  const filters = buildFilters(stats ?? defaultStaffStats());
  return (
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
    {filters.map((f) => {
      const Icon = f.icon;
      const isActive = active === f.id;
      return (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className={`cursor-pointer rounded-xl border p-3.5 text-left transition-colors ${
            isActive
              ? 'border-sage-deep bg-sage-mist shadow-sm'
              : 'border-border-sage bg-white hover:bg-sage-mist/50'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                {f.label}
              </p>
              <p className="mt-1 text-2xl font-bold leading-none text-ink">{f.count}</p>
              <p className="mt-1 text-[11px] text-ink-soft">Team members</p>
            </div>
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${f.iconClass}`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </div>
          </div>
        </button>
      );
    })}
  </div>
  );
};

interface ChipsProps {
  active: StaffFilter;
  onChange: (filter: StaffFilter) => void;
}

const chipFilters: { id: StaffFilter; label: string; activeClass: string }[] = [
  { id: 'all', label: 'All Staff', activeClass: 'border-sage-deep bg-sage-mist text-sage-deep' },
  { id: 'doctor', label: 'Doctors', activeClass: 'border-violet-300 bg-violet-50 text-violet-700' },
  { id: 'therapist', label: 'Therapists', activeClass: 'border-pink-300 bg-pink-50 text-pink-700' },
  { id: 'support', label: 'Support Staff', activeClass: 'border-teal-300 bg-teal-50 text-teal-800' },
];

export const StaffFilterChips = ({ active, onChange }: ChipsProps) => (
  <div className="flex flex-wrap items-center gap-2">
    {chipFilters.map((f) => {
      const isActive = active === f.id;
      return (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
            isActive
              ? f.activeClass
              : 'border-border-sage bg-white text-ink-soft hover:bg-sage-mist/60'
          }`}
        >
          {f.label}
        </button>
      );
    })}
  </div>
);
