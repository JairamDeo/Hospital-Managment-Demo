import type { TherapistOnDuty } from '@/types/panchakarma.types';

interface Props {
  therapists: TherapistOnDuty[];
}

export const TherapistsPanel = ({ therapists }: Props) => (
  <div className="shrink-0 rounded-xl border border-border-sage bg-white">
    <div className="shrink-0 border-b border-border-sage px-4 py-2.5">
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
        Therapists on Duty
      </h3>
    </div>
    <div className="divide-y divide-border-sage/80">
      {therapists.map((t) => (
        <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${t.avatarClass}`}
          >
            {t.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{t.name}</p>
            <p className="truncate text-[11px] text-ink-soft">{t.specialty}</p>
          </div>
          <span className="shrink-0 text-xs font-semibold text-ink-ghost">
            {t.patientCount} pts
          </span>
        </div>
      ))}
    </div>
  </div>
);
