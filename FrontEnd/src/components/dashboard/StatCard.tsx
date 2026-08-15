import type { LucideIcon } from 'lucide-react';
import { TrendingUp } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  subLabel: string;
  icon: LucideIcon;
  showTrend?: boolean;
  className?: string;
}

export const StatCard = ({
  label,
  value,
  subLabel,
  icon: Icon,
  showTrend = false,
  className = 'bg-sage-deep',
}: StatCardProps) => (
  <div
    className={`relative flex h-[112px] items-center overflow-hidden rounded-xl px-4 text-white ${className}`}
  >
    {/* Single top-right corner curve */}
    <div
      className="pointer-events-none absolute right-0 top-0 h-[65%] w-[36%] max-w-[88px] rounded-bl-[100%] bg-white/[0.1]"
      aria-hidden
    />

    <div className="relative z-10 min-w-0 flex-1 pr-2">
      <p className="text-xs font-medium text-white/80">{label}</p>
      <p className="mt-2 text-2xl font-bold leading-none tracking-tight">{value}</p>
      {showTrend ? (
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">
          <TrendingUp className="h-2.5 w-2.5" strokeWidth={2.5} />
          {subLabel}
        </span>
      ) : (
        <p className="mt-1.5 text-[10px] font-medium text-white/70">{subLabel}</p>
      )}
    </div>

    <div className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-md bg-white/20">
      <Icon className="h-[18px] w-[18px] text-white" strokeWidth={1.75} />
    </div>
  </div>
);
