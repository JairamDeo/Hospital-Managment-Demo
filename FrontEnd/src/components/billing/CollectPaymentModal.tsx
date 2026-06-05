import { Button } from '@/components/ui/Button';
import { billingAdminService } from '@/services/billing/billingAdmin.service';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/utils/helpers';
import { formatRupee, type InvoiceDetail, type PaymentMethodType } from '@/types/billing.types';
import { useState } from 'react';

interface Props {
  open: boolean;
  invoice: InvoiceDetail;
  onClose: () => void;
  onCollected: () => void | Promise<void>;
}

export const CollectPaymentModal = ({ open, invoice, onClose, onCollected }: Props) => {
  const { showToast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('Cash');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleCollect = async () => {
    setSubmitting(true);
    try {
      await billingAdminService.collectPayment(invoice.id, paymentMethod);
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
          Invoice #{invoice.id} · {formatRupee(invoice.amount)}
        </p>
        <p className="mt-0.5 text-xs text-ink-ghost">{invoice.patientName}</p>

        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-semibold text-ink-ghost">Payment method</span>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
            className="w-full rounded-lg border border-border-sage px-3 py-2 text-sm"
          >
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Net Banking">Net Banking</option>
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
