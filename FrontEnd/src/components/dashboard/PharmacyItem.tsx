import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

interface PharmacyItemProps {
  name: string;
  unitsRemaining: number;
  maxUnits: number;
  status: 'Low' | 'Critical' | 'OK';
  icon: LucideIcon;
}

const statusConfig = {
  Low: { badge: 'bg-warning-bg text-warning', bar: 'bg-warning' },
  Critical: { badge: 'bg-danger-bg text-danger', bar: 'bg-danger' },
  OK: { badge: 'bg-success-bg text-success', bar: 'bg-success' },
};

export const PharmacyItem = ({
  name,
  unitsRemaining,
  maxUnits,
  status,
  icon: Icon,
}: PharmacyItemProps) => {
  const pct = Math.min(100, Math.round((unitsRemaining / maxUnits) * 100));
  const [width, setWidth] = useState(0);
  const styles = statusConfig[status];

  useEffect(() => {
    const t = requestAnimationFrame(() => setWidth(pct));
    return () => cancelAnimationFrame(t);
  }, [pct]);

  return (
    <div className="flex h-[76px] shrink-0 items-center gap-2.5 px-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sage-mist">
        <Icon className="h-4 w-4 text-sage-deep" strokeWidth={1.75} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-xs font-semibold text-ink">{name}</p>
          <span className={`shrink-0 rounded-full px-1.5 py-px text-[9px] font-bold ${styles.badge}`}>
            {status}
          </span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-sage-mist">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${styles.bar}`}
            style={{ width: `${width}%` }}
          />
        </div>
        <p className="mt-1 text-[10px] text-ink-ghost">{unitsRemaining} units remaining</p>
      </div>

      <button
        type="button"
        className="shrink-0 cursor-pointer rounded-full bg-sage-deep px-3 py-1 text-[10px] font-semibold text-white hover:bg-sage-mid"
      >
        Reorder
      </button>
    </div>
  );
};
