import type { InvoiceDetail } from '@/types/billing.types';
import { formatRupee } from '@/types/billing.types';

interface Props {
  invoice: InvoiceDetail;
}

export const InvoicePaymentCard = ({ invoice }: Props) => (
  <div className="rounded-2xl border border-border-sage bg-white p-4 shadow-sm">
    <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
      Payment Summary
    </h3>
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-soft">Subtotal</span>
        <span className="font-medium text-ink">{formatRupee(invoice.subtotal)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-soft">Tax (5%)</span>
        <span className="font-medium text-ink">{formatRupee(invoice.tax)}</span>
      </div>
      {invoice.discount > 0 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-soft">Discount</span>
          <span className="font-medium text-success">−{formatRupee(invoice.discount)}</span>
        </div>
      ) : null}
      <div className="border-t border-border-sage/80 pt-2">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span className="text-ink">Total</span>
          <span className="text-sage-deep">{formatRupee(invoice.amount)}</span>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-success-bg/60 px-3 py-2 text-sm">
        <span className="text-success">Paid</span>
        <span className="font-semibold text-success">{formatRupee(invoice.paidAmount)}</span>
      </div>
      {invoice.balance > 0 ? (
        <div className="flex items-center justify-between rounded-lg bg-warning-bg/60 px-3 py-2 text-sm">
          <span className="text-warning">Balance Due</span>
          <span className="font-semibold text-warning">{formatRupee(invoice.balance)}</span>
        </div>
      ) : null}
    </div>
  </div>
);
