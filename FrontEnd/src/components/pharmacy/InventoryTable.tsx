import { Button } from '@/components/ui/Button';
import type { PharmacyItem } from '@/pages/pharmacy/data/mockPharmacy';
import { InventoryStatusBadge } from './InventoryStatusBadge';
import { StockLevelBar } from './StockLevelBar';

interface Props {
  items: PharmacyItem[];
  onReorder: (item: PharmacyItem) => void;
}

const levelVariant = (status: PharmacyItem['status']) => {
  if (status === 'Critical') return 'critical' as const;
  if (status === 'Low') return 'low' as const;
  return 'ok' as const;
};

export const InventoryTable = ({ items, onReorder }: Props) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[680px] border-collapse">
      <thead>
        <tr className="border-b border-border-sage bg-cream/50">
          {['Item', 'Category', 'Stock', 'Level', 'Status', 'Action'].map((col) => (
            <th
              key={col}
              className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-ink-ghost"
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-4 py-10 text-center text-sm text-ink-soft">
              No items found
            </td>
          </tr>
        ) : (
          items.map((item) => {
            const Icon = item.icon;
            return (
              <tr
                key={item.id}
                className="border-b border-border-sage/80 transition-colors last:border-b-0 hover:bg-sage-mist/40"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sage-mist">
                      <Icon className="h-4 w-4 text-sage-deep" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{item.name}</p>
                      <p className="text-[11px] text-ink-ghost">{item.subtitle}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-ink-soft">{item.category}</td>
                <td className="px-4 py-3 text-sm font-medium text-ink">{item.stock} units</td>
                <td className="px-4 py-3">
                  <StockLevelBar value={item.level} variant={levelVariant(item.status)} />
                </td>
                <td className="px-4 py-3">
                  <InventoryStatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3">
                  {item.status === 'OK' ? (
                    <button
                      type="button"
                      onClick={() => onReorder(item)}
                      className="cursor-pointer text-xs font-semibold text-sage-deep hover:underline"
                    >
                      Order
                    </button>
                  ) : (
                    <Button
                      className="h-7 rounded-md px-3 py-0 text-xs"
                      onClick={() => onReorder(item)}
                    >
                      Reorder
                    </Button>
                  )}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
);
