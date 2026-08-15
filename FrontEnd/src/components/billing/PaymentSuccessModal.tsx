import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatRupee, type PaymentCollectionSuccess } from '@/types/billing.types';

interface Props {
  open: boolean;
  collection: PaymentCollectionSuccess | null;
  onClose: () => void;
}

export const PaymentSuccessModal = ({ open, collection, onClose }: Props) => {
  if (!open || !collection) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-ink/50" onClick={onClose} aria-label="Close" />
      <div className="relative w-full max-w-md rounded-2xl border border-border-sage bg-white p-6 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success">
            <CheckCircle2 className="h-8 w-8" strokeWidth={2} />
          </span>
          <h2 className="mt-4 font-serif text-xl font-semibold text-ink">Payment collected</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {formatRupee(collection.amount)} received · Invoice marked {collection.status}
          </p>
        </div>

        <dl className="mt-5 space-y-2.5 rounded-xl border border-border-sage bg-cream/30 p-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-ghost">Patient</dt>
            <dd className="text-right font-medium text-ink">{collection.patientName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-ghost">Invoice</dt>
            <dd className="text-right font-medium text-ink">#{collection.invoiceCode}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-ghost">For</dt>
            <dd className="text-right font-medium text-ink">{collection.feeTypeLabel}</dd>
          </div>
          {collection.treatment ? (
            <div className="flex justify-between gap-3">
              <dt className="shrink-0 text-ink-ghost">Details</dt>
              <dd className="text-right text-ink-soft">{collection.treatment}</dd>
            </div>
          ) : null}
          {collection.doctorName ? (
            <div className="flex justify-between gap-3">
              <dt className="text-ink-ghost">Doctor / therapist</dt>
              <dd className="text-right text-ink-soft">{collection.doctorName}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt className="text-ink-ghost">Payment method</dt>
            <dd className="text-right font-medium text-ink">{collection.paymentMethod}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-border-sage/70 pt-2">
            <dt className="text-ink-ghost">Collected by</dt>
            <dd className="text-right font-semibold text-sage-deep">{collection.collectedBy}</dd>
          </div>
        </dl>

        <Button className="mt-5 w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
};
