import type { PharmacyItemView } from '@/types/pharmacy.types';
import { InventoryStatusBadge } from './InventoryStatusBadge';
import { formatRupee } from '@/types/billing.types';

interface Props {
  items: PharmacyItemView[];
}

const COLUMNS = ['Item', 'Pack', 'Brand', 'Price', 'Expiry', 'Category', 'Stock', 'Status'] as const;

const cellMuted = 'px-3 py-3 text-sm text-ink-soft';

const StackedCell = ({
  value,
  label,
  valueClassName = 'text-sm font-medium text-ink',
}: {
  value: string | number;
  label: string;
  valueClassName?: string;
}) => (
  <div className="flex flex-col items-start leading-tight">
    <span className={valueClassName}>{value}</span>
    <span className="text-[10px] text-ink-ghost">{label}</span>
  </div>
);

const packDisplay = (item: PharmacyItemView) => {
  const upp = item.unitsPerPack ?? item.packQuantity;
  switch (item.itemType) {
    case 'strip':
      return { value: upp, label: 'tablets / box' };
    case 'weight':
      return { value: upp, label: 'g / box' };
    default: {
      const size = item.unitSize?.trim();
      if (!size) return null;
      const match = size.match(/^([\d.]+)\s*(.*)$/);
      if (match) {
        return { value: match[1], label: match[2].trim() || 'per piece' };
      }
      return { value: size, label: 'per piece' };
    }
  }
};

const priceDisplay = (item: PharmacyItemView) => {
  const price = item.salePrice ?? 0;
  if (price <= 0) return null;

  switch (item.itemType) {
    case 'strip':
      return {
        main: formatRupee(price),
        sub: item.pricePerTablet ? `${formatRupee(item.pricePerTablet)}/tablet` : 'per box',
      };
    case 'weight':
      return {
        main: formatRupee(price),
        sub: item.pricePerGram ? `${formatRupee(item.pricePerGram)}/g` : 'per box',
      };
    default:
      return { main: formatRupee(price), sub: 'per piece' };
  }
};

export const InventoryTable = ({ items }: Props) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[720px] border-collapse">
      <thead>
        <tr className="border-b border-border-sage bg-cream/50">
          {COLUMNS.map((col) => (
            <th
              key={col}
              className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-ink-ghost"
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr>
            <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-sm text-ink-soft">
              No items found
            </td>
          </tr>
        ) : (
          items.map((item) => {
            const Icon = item.icon;
            const pack = packDisplay(item);
            const price = priceDisplay(item);
            return (
              <tr
                key={item.id}
                className="border-b border-border-sage/80 transition-colors last:border-b-0 hover:bg-sage-mist/40"
              >
                <td className="px-4 py-3">
                  <div className="flex min-w-[140px] items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sage-mist">
                      <Icon className="h-4 w-4 text-sage-deep" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{item.name}</p>
                      <p className="text-[11px] text-ink-ghost">{item.itemCode}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  {pack ? (
                    <StackedCell value={pack.value} label={pack.label} />
                  ) : (
                    <span className="text-sm text-ink-ghost">—</span>
                  )}
                </td>
                <td className={`${cellMuted} max-w-[120px] truncate`} title={item.company}>
                  {item.company?.trim() ? item.company : '—'}
                </td>
                <td className={`${cellMuted} whitespace-nowrap`}>
                  {price ? (
                    <StackedCell value={price.main} label={price.sub} />
                  ) : (
                    '—'
                  )}
                </td>
                <td className={`${cellMuted} whitespace-nowrap`}>
                  {item.expiryDate?.trim() ? item.expiryDate : '—'}
                </td>
                <td className={`${cellMuted} max-w-[100px] truncate`} title={item.category}>
                  {item.category}
                </td>
                <td className="px-3 py-3">
                  <StackedCell
                    value={item.stockDisplay ?? item.stock}
                    label={
                      item.itemType === 'strip'
                        ? 'in stock'
                        : item.itemType === 'weight'
                          ? 'in stock'
                          : 'available'
                    }
                    valueClassName="text-sm font-medium text-ink max-w-[160px] truncate"
                  />
                </td>
                <td className="px-4 py-3">
                  <InventoryStatusBadge status={item.status} />
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
);
