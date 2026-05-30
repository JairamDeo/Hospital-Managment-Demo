import { TrendingDown, TrendingUp } from 'lucide-react';
import type { KpiStat } from '@/pages/analytics/data/mockAnalytics';

export const AnalyticsStatCard = ({ stat }: { stat: KpiStat }) => (
  <div className="rounded-xl border border-border-sage bg-white p-3.5">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
          {stat.label}
        </p>
        <p className="mt-1 text-2xl font-bold leading-none text-ink">{stat.value}</p>
        <p className="mt-1 text-[11px] text-ink-soft">{stat.subLabel}</p>
      </div>
      <span
        className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
          stat.trendUp ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'
        }`}
      >
        {stat.trendUp ? (
          <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
        ) : (
          <TrendingDown className="h-3 w-3" strokeWidth={2.5} />
        )}
        {stat.trend}%
      </span>
    </div>
  </div>
);
