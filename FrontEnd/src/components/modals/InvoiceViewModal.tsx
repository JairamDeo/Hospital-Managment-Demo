import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { Invoice } from '@/types/billing.types';
import { formatRupee } from '@/types/billing.types';
import { InvoiceStatusBadge } from '@/components/billing/InvoiceStatusBadge';

interface Props {
  open: boolean;
  invoice: Invoice | null;
  onClose: () => void;
}

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">{label}</p>
    <p className="mt-1 text-sm font-medium text-ink">{value}</p>
  </div>
);

export const InvoiceViewModal = ({ open, invoice, onClose }: Props) => {
  if (!invoice) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invoice Details"
      subtitle={`#${invoice.id}`}
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="mb-5 flex items-center justify-between rounded-xl bg-sage-mist/50 p-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${invoice.avatarClass}`}
          >
            {invoice.initials}
          </div>
          <div>
            <p className="font-bold text-ink">{invoice.patientName}</p>
            <p className="text-sm text-ink-soft">{invoice.patientId}</p>
          </div>
        </div>
        <InvoiceStatusBadge status={invoice.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date" value={invoice.date} />
        <Field label="Treatment" value={invoice.treatment} />
        <Field label="Amount" value={formatRupee(invoice.amount)} />
        <Field label="Status" value={invoice.status} />
      </div>
    </Modal>
  );
};
