import { useEffect, useState } from 'react';
import type { TreatmentDemand } from '@/pages/analytics/data/mockAnalytics';

interface Props {
  items: TreatmentDemand[];
}

export const TreatmentDemandBars = ({ items }: Props) => (
  <div className="space-y-4">
    {items.map((item) => (
      <DemandBar key={item.label} label={item.label} percent={item.percent} />
    ))}
  </div>
);

const DemandBar = ({ label, percent }: { label: string; percent: number }) => {
  const [width, setWidth] = useState(0);
  const target = Math.min(100, Math.max(0, percent));

  useEffect(() => {
    setWidth(0);
    const frame = requestAnimationFrame(() => setWidth(target));
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="truncate text-sm text-ink-soft">{label}</span>
        <span className="shrink-0 text-sm font-semibold text-ink">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-sage-mist">
        <div
          className="progress-bar-fill relative h-full overflow-hidden rounded-full transition-[width] duration-1000 ease-out"
          style={{ width: `${width}%` }}
        >
          {width > 0 ? <span className="progress-bar-shimmer absolute inset-0" aria-hidden /> : null}
        </div>
      </div>
    </div>
  );
};
