import type { StockStatus } from '@/types/pharmacy.types';

const styles: Record<StockStatus, string> = {
  Critical: 'bg-danger-bg text-danger',
  Low: 'bg-warning-bg text-warning',
  OK: 'bg-success-bg text-success',
};

const normalizeStatus = (status: string | undefined): StockStatus => {
  if (status === 'Critical' || status === 'Low' || status === 'OK') return status;
  return 'OK';
};

export const InventoryStatusBadge = ({ status }: { status: StockStatus | string }) => {
  const safe = normalizeStatus(status);
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles[safe]}`}
    >
      {safe}
    </span>
  );
};
