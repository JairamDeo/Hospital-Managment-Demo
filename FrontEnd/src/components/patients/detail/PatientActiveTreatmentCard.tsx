import { useEffect, useState } from 'react';
import { Leaf } from 'lucide-react';
import type { ActiveTreatment } from '@/types/patientDetail.types';

interface Props {
  treatment: ActiveTreatment;
}

export const PatientActiveTreatmentCard = ({ treatment }: Props) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setWidth(0);
    const frame = requestAnimationFrame(() => setWidth(treatment.percentComplete));
    return () => cancelAnimationFrame(frame);
  }, [treatment.percentComplete]);

  return (
    <div className="rounded-2xl border border-border-sage bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sage-mist text-sage-deep">
          <Leaf className="h-3.5 w-3.5" strokeWidth={2.25} />
        </span>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
          Active Treatment
        </h3>
      </div>
      <p className="mt-3 text-sm font-semibold text-ink">{treatment.program}</p>
      <p className="mt-0.5 text-xs text-ink-soft">{treatment.stage}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-sage-mist">
        <div
          className="progress-bar-fill h-full rounded-full transition-[width] duration-1000 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs">
        <span className="text-ink-ghost">
          Day {treatment.dayCurrent} of {treatment.dayTotal}
        </span>
        <span className="font-semibold text-sage-deep">{treatment.percentComplete}% complete</span>
      </div>
    </div>
  );
};
