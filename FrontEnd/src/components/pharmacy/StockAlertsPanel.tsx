import type { StockAlert } from '@/types/pharmacy.types';

interface Props {
  alerts: StockAlert[];
  className?: string;
}

const dotColors = {
  Critical: 'bg-danger',
  Low: 'bg-warning',
};

export const StockAlertsPanel = ({ alerts, className = '' }: Props) => (
  <div
    className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-border-sage bg-white ${className}`}
  >
    <div className="shrink-0 border-b border-border-sage px-4 py-2.5">
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
        Stock Alerts
      </h3>
    </div>
    <div className="scrollbar-thin min-h-0 flex-1 divide-y divide-border-sage/80 overflow-y-auto">
      {alerts.map((a) => (
        <div key={a.id} className="px-4 py-3">
          <div className="flex items-start gap-2">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColors[a.status]}`} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">
                {a.itemName}{' '}
                <span className={a.status === 'Critical' ? 'text-danger' : 'text-warning'}>
                  — {a.status}
                </span>
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-ink-soft">{a.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
