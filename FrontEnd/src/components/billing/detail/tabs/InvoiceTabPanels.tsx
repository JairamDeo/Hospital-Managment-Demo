import type { ReactNode } from 'react';
import type { InvoiceLineItem, PaymentRecord } from '@/types/billing.types';
import { formatRupee } from '@/types/billing.types';

const TableShell = ({ children }: { children: ReactNode }) => (
  <div className="overflow-x-auto rounded-xl border border-border-sage">
    <table className="w-full min-w-[640px] border-collapse">{children}</table>
  </div>
);

const Th = ({ children }: { children: ReactNode }) => (
  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
    {children}
  </th>
);

const PAY_STATUS: Record<PaymentRecord['status'], string> = {
  Completed: 'bg-success-bg text-success',
  Pending: 'bg-warning-bg text-warning',
  Failed: 'bg-danger-bg text-danger',
};

export const InvoiceLineItemsTab = ({ items }: { items: InvoiceLineItem[] }) => (
  <TableShell>
    <thead>
      <tr className="border-b border-border-sage bg-cream/60">
        <Th>Description</Th>
        <Th>Qty</Th>
        <Th>Rate</Th>
        <Th>Amount</Th>
      </tr>
    </thead>
    <tbody>
      {items.map((item) => (
        <tr key={item.id} className="border-b border-border-sage/70 last:border-b-0 hover:bg-sage-mist/30">
          <td className="px-4 py-3 text-sm font-medium text-ink">{item.description}</td>
          <td className="px-4 py-3 text-sm text-ink-soft">{item.qty}</td>
          <td className="px-4 py-3 text-sm text-ink-soft">{formatRupee(item.rate)}</td>
          <td className="px-4 py-3 text-sm font-semibold text-ink">{formatRupee(item.amount)}</td>
        </tr>
      ))}
    </tbody>
  </TableShell>
);

export const InvoicePaymentsTab = ({ payments }: { payments: PaymentRecord[] }) => (
  <TableShell>
    <thead>
      <tr className="border-b border-border-sage bg-cream/60">
        <Th>Date</Th>
        <Th>Method</Th>
        <Th>Reference</Th>
        <Th>Amount</Th>
        <Th>Status</Th>
      </tr>
    </thead>
    <tbody>
      {payments.length === 0 ? (
        <tr>
          <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-soft">
            No payments recorded
          </td>
        </tr>
      ) : (
        payments.map((p) => (
          <tr key={p.id} className="border-b border-border-sage/70 last:border-b-0 hover:bg-sage-mist/30">
            <td className="px-4 py-3 text-sm text-ink-soft">{p.date}</td>
            <td className="px-4 py-3 text-sm font-medium text-ink">{p.method}</td>
            <td className="px-4 py-3 text-sm text-ink-ghost">{p.reference}</td>
            <td className="px-4 py-3 text-sm font-semibold text-ink">{formatRupee(p.amount)}</td>
            <td className="px-4 py-3">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${PAY_STATUS[p.status]}`}>
                {p.status}
              </span>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </TableShell>
);
