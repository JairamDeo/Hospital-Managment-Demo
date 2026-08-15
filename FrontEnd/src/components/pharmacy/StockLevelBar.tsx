import { useEffect, useState } from 'react';

type Variant = 'critical' | 'low' | 'ok' | 'sage';

interface Props {
  value: number;
  variant?: Variant;
  showLabel?: boolean;
  className?: string;
}

const barColors: Record<Variant, string> = {
  critical: 'bg-danger',
  low: 'bg-warning',
  ok: 'bg-success',
  sage: 'progress-bar-fill',
};

export const StockLevelBar = ({
  value,
  variant = 'sage',
  showLabel = true,
  className = '',
}: Props) => {
  const target = Math.min(100, Math.max(0, value));
  const [width, setWidth] = useState(0);
  const isSage = variant === 'sage';

  useEffect(() => {
    setWidth(0);
    const frame = requestAnimationFrame(() => setWidth(target));
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-1.5 min-w-[72px] flex-1 overflow-hidden rounded-full bg-sage-mist">
        <div
          className={`relative h-full overflow-hidden rounded-full transition-[width] duration-1000 ease-out ${isSage ? barColors.sage : barColors[variant]}`}
          style={{ width: `${width}%` }}
        >
          {isSage && width > 0 ? (
            <span className="progress-bar-shimmer absolute inset-0" aria-hidden />
          ) : null}
        </div>
      </div>
      {showLabel ? (
        <span className="w-8 shrink-0 text-right text-xs font-semibold text-ink-soft">
          {value}%
        </span>
      ) : null}
    </div>
  );
};
