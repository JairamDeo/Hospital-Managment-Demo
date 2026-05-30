import type { StockStatus } from '@/pages/pharmacy/data/mockPharmacy';

const styles: Record<StockStatus, string> = {
  Critical: 'bg-danger-bg text-danger',
  Low: 'bg-warning-bg text-warning',
  OK: 'bg-success-bg text-success',
};

export const InventoryStatusBadge = ({ status }: { status: StockStatus }) => (
  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles[status]}`}>
    {status}
  </span>
);
