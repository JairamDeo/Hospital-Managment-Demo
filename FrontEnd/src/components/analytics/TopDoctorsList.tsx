import type { TopDoctor } from '@/pages/analytics/data/mockAnalytics';

interface Props {
  doctors: TopDoctor[];
}

export const TopDoctorsList = ({ doctors }: Props) => (
  <div className="divide-y divide-border-sage/80">
    {doctors.map((d, i) => (
      <div key={d.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
        <span className="w-4 shrink-0 text-sm font-bold text-ink-ghost">{i + 1}</span>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${d.avatarClass}`}
        >
          {d.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-sm font-semibold text-ink">{d.name}</p>
          <p className="truncate text-[11px] text-ink-soft">{d.specialty}</p>
        </div>
        <span className="shrink-0 text-sm font-bold text-sage-deep">{d.points} pts</span>
      </div>
    ))}
  </div>
);
