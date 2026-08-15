import { Activity, Droplets, Heart, Scale, Thermometer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PatientVitals } from '@/types/patientDetail.types';

interface Props {
  vitals: PatientVitals;
  /** Sidebar uses 2×2 grid so values are not truncated */
  layout?: 'row' | 'sidebar';
}

const VITAL_CONFIG: {
  key: keyof PatientVitals;
  label: string;
  icon: LucideIcon;
  tone: string;
}[] = [
  { key: 'temp', label: 'Temp', icon: Thermometer, tone: 'text-orange-600 bg-orange-50' },
  { key: 'bp', label: 'BP', icon: Activity, tone: 'text-blue-600 bg-blue-50' },
  { key: 'pulse', label: 'Pulse', icon: Heart, tone: 'text-emerald-600 bg-emerald-50' },
  { key: 'spo2', label: 'SpO₂', icon: Droplets, tone: 'text-cyan-600 bg-cyan-50' },
  { key: 'bmi', label: 'Weight', icon: Scale, tone: 'text-violet-600 bg-violet-50' },
];

export const PatientVitalsRow = ({ vitals, layout = 'row' }: Props) => {
  const isSidebar = layout === 'sidebar';

  return (
    <div
      className={
        isSidebar
          ? 'grid grid-cols-2 gap-2'
          : 'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 sm:gap-3'
      }
    >
      {VITAL_CONFIG.map(({ key, label, icon: Icon, tone }) => (
        <div
          key={key}
          className="min-w-0 rounded-xl border border-border-sage bg-white px-3 py-2.5 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${tone}`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
              {label}
            </span>
          </div>
          <p
            className={`mt-1.5 font-semibold text-ink ${isSidebar ? 'text-sm leading-snug' : 'text-base'}`}
            title={vitals[key]}
          >
            {vitals[key]}
          </p>
        </div>
      ))}
    </div>
  );
};
