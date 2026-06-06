import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { billingAdminService } from '@/services/billing/billingAdmin.service';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/utils/helpers';
import {
  formatRupee,
  PAYMENT_METHOD_OPTIONS,
  type InvoiceDetail,
  type PaymentMethodType,
} from '@/types/billing.types';

interface Props {
  open: boolean;
  invoice: InvoiceDetail;
  onClose: () => void;
  onCollected: () => void | Promise<void>;
}

export const CollectPaymentModal = ({ open, invoice, onClose, onCollected }: Props) => {
  const { showToast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('Cash');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const balance = invoice.balance ?? Math.max(0, invoice.amount - (invoice.paidAmount ?? 0));
  const allowPartial = balance > 0 && balance < invoice.amount;

  useEffect(() => {
    if (open) {
      setPaymentMethod('Cash');
      setAmount(String(balance));
    }
  }, [open, balance]);

  if (!open) return null;

  const handleCollect = async () => {
    const payAmount = Number(amount);
    if (!Number.isFinite(payAmount) || payAmount <= 0) {
      showToast('Enter a valid payment amount', 'error');
      return;
    }
    if (payAmount > balance) {
      showToast(`Amount cannot exceed balance of ${formatRupee(balance)}`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      await billingAdminService.collectPayment(
        invoice.id,
        paymentMethod,
        allowPartial || payAmount < balance ? payAmount : undefined
      );
      await onCollected();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-ink/40" onClick={onClose} aria-label="Close" />
      <div className="relative w-full max-w-sm rounded-2xl border border-border-sage bg-white p-5 shadow-xl">
        <h2 className="font-serif text-lg font-semibold text-ink">Collect payment</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Invoice #{invoice.id} · Total {formatRupee(invoice.amount)}
        </p>
        {balance < invoice.amount ? (
          <p className="mt-0.5 text-xs text-warning">
            Balance due: {formatRupee(balance)}
            {(invoice.paidAmount ?? 0) > 0 ? ` (${formatRupee(invoice.paidAmount ?? 0)} paid)` : ''}
          </p>
        ) : null}
        <p className="mt-0.5 text-xs text-ink-ghost">{invoice.patientName}</p>

        {allowPartial || invoice.status === 'Partial' ? (
          <label className="mt-4 block">
            <span className="mb-1 block text-xs font-semibold text-ink-ghost">Amount to collect (₹)</span>
            <input
              type="number"
              min={0.01}
              max={balance}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-border-sage px-3 py-2 text-sm"
            />
          </label>
        ) : null}

        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-semibold text-ink-ghost">Payment method</span>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
            className="w-full rounded-lg border border-border-sage px-3 py-2 text-sm"
          >
            {PAYMENT_METHOD_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-5 flex gap-2">
          <Button onClick={() => void handleCollect()} disabled={submitting}>
            Confirm payment
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
