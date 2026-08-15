import type { InvoiceStatus } from '@/types/billing.types';

const styles: Record<InvoiceStatus, string> = {
  Paid: 'bg-success-bg text-success',
  Pending: 'bg-warning-bg text-warning',
  Partial: 'bg-blue-50 text-blue-700',
  Overdue: 'bg-danger-bg text-danger',
};

export const InvoiceStatusBadge = ({ status }: { status: InvoiceStatus }) => (
  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles[status]}`}>
    {status}
  </span>
);
