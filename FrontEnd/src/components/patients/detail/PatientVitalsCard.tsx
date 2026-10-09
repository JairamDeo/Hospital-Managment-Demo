import { Activity, Droplets, Heart, Plus, Scale, Thermometer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PatientVitals } from '@/types/patientDetail.types';

interface Props {
  vitals: PatientVitals;
  canAdd?: boolean;
  onAdd?: () => void;
}

const VITAL_CONFIG: {
  key: keyof PatientVitals;
  label: string;
  unit: string;
  icon: LucideIcon;
  accent: string;
  iconBg: string;
}[] = [
  {
    key: 'temp',
    label: 'Temp',
    unit: '°F',
    icon: Thermometer,
    accent: 'text-orange-700',
    iconBg: 'bg-orange-50 text-orange-600 ring-orange-100',
  },
  {
    key: 'bp',
    label: 'BP',
    unit: 'mmHg',
    icon: Activity,
    accent: 'text-sky-700',
    iconBg: 'bg-sky-50 text-sky-600 ring-sky-100',
  },
  {
    key: 'pulse',
    label: 'Pulse',
    unit: 'bpm',
    icon: Heart,
    accent: 'text-emerald-700',
    iconBg: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  },
  {
    key: 'spo2',
    label: 'SpO₂',
    unit: '%',
    icon: Droplets,
    accent: 'text-cyan-700',
    iconBg: 'bg-cyan-50 text-cyan-600 ring-cyan-100',
  },
  {
    key: 'bmi',
    label: 'Weight',
    unit: 'kg',
    icon: Scale,
    accent: 'text-violet-700',
    iconBg: 'bg-violet-50 text-violet-600 ring-violet-100',
  },
];

const isEmpty = (value: string | undefined) => !value || value === '—' || value === '-';

export const PatientVitalsRow = ({ vitals, canAdd = false, onAdd }: Props) => (
  <section className="overflow-hidden rounded-2xl border border-border-sage/80 bg-gradient-to-br from-white via-cream/40 to-sage-mist/30 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-sage/60 px-4 py-2.5">
      <div>
        <h3 className="text-sm font-semibold text-ink">Current vitals</h3>
        <p className="text-[11px] text-ink-soft">Latest recorded readings</p>
      </div>
      {canAdd && onAdd ? (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-sage-deep px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-sage-deep/90"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Add vitals
        </button>
      ) : null}
    </div>

    <div className="grid grid-cols-2 gap-px bg-border-sage/50 sm:grid-cols-3 lg:grid-cols-5">
      {VITAL_CONFIG.map(({ key, label, unit, icon: Icon, accent, iconBg }) => {
        const empty = isEmpty(vitals[key]);
        return (
          <div
            key={key}
            className="flex min-w-0 items-center gap-3 bg-white/90 px-3.5 py-3.5 backdrop-blur-[1px]"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${iconBg}`}
            >
              <Icon className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                {label}
                <span className="ml-1 font-medium normal-case tracking-normal text-ink-ghost/80">
                  {unit}
                </span>
              </p>
              <p
                className={`mt-0.5 truncate text-base font-semibold tabular-nums leading-tight ${
                  empty ? 'text-ink-ghost' : accent
                }`}
                title={empty ? undefined : vitals[key]}
              >
                {empty ? '—' : vitals[key]}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  </section>
);
