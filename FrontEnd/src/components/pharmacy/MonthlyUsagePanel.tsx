import type { MonthlyUsageItem } from '@/types/pharmacy.types';
import { StockLevelBar } from './StockLevelBar';

interface Props {
  items: MonthlyUsageItem[];
  className?: string;
}

export const MonthlyUsagePanel = ({ items, className = '' }: Props) => (
  <div
    className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-border-sage bg-white ${className}`}
  >
    <div className="shrink-0 border-b border-border-sage px-4 py-2.5">
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
        Monthly Usage
      </h3>
    </div>
    <div className="scrollbar-thin min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
      {items.map((item) => (
        <div key={item.id}>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-ink">{item.name}</span>
          </div>
          <StockLevelBar value={item.usage} variant="sage" />
        </div>
      ))}
    </div>
  </div>
);
