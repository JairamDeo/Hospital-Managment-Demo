import { Activity, Heart, Scale, Thermometer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PatientVitals } from '@/pages/patients/data/mockPatientDetails';

interface Props {
  vitals: PatientVitals;
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
  { key: 'bmi', label: 'BMI', icon: Scale, tone: 'text-violet-600 bg-violet-50' },
];

export const PatientVitalsRow = ({ vitals }: Props) => (
  <div className="grid grid-cols-4 gap-2 sm:gap-3">
    {VITAL_CONFIG.map(({ key, label, icon: Icon, tone }) => (
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
        <p className="mt-1.5 truncate text-sm font-semibold text-ink sm:mt-2 sm:text-base">{vitals[key]}</p>
      </div>
    ))}
  </div>
);
