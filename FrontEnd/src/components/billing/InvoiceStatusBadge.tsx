import type { InvoiceStatus } from '@/pages/billing/data/mockBilling';

const styles: Record<InvoiceStatus, string> = {
  Paid: 'bg-success-bg text-success',
  Pending: 'bg-warning-bg text-warning',
  Overdue: 'bg-danger-bg text-danger',
};

export const InvoiceStatusBadge = ({ status }: { status: InvoiceStatus }) => (
  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles[status]}`}>
    {status}
  </span>
);
