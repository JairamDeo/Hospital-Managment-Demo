import { Download, Mail, Receipt, SquarePen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { InvoiceStatusBadge } from '@/components/billing/InvoiceStatusBadge';
import { patientDetailPath } from '@/constants/routes';
import type { InvoiceDetail } from '@/pages/billing/data/mockInvoiceDetails';
import { formatRupee } from '@/pages/billing/data/mockBilling';

interface Props {
  invoice: InvoiceDetail;
  onDownload: () => void;
  onSendReminder: () => void;
  onEdit: () => void;
}

const DetailCell = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-cream/60 px-3 py-2">
    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">{label}</p>
    <p className="mt-0.5 text-sm font-medium text-ink">{value}</p>
  </div>
);

export const InvoiceProfileCard = ({ invoice, onDownload, onSendReminder, onEdit }: Props) => (
  <div className="overflow-hidden rounded-2xl border border-border-sage bg-white shadow-sm">
    <div className="bg-gradient-to-b from-sage-mist/80 to-white px-5 pb-5 pt-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-deep text-white shadow-sm">
        <Receipt className="h-6 w-6" strokeWidth={2} />
      </div>
      <h2 className="mt-3 font-serif text-xl font-semibold text-ink">#{invoice.id}</h2>
      <p className="mt-0.5 text-xs text-ink-ghost">{invoice.date}</p>
      <div className="mt-2.5 flex justify-center">
        <InvoiceStatusBadge status={invoice.status} />
      </div>
      <p className="mt-3 font-serif text-2xl font-semibold text-sage-deep">
        {formatRupee(invoice.amount)}
      </p>
    </div>

    <div className="space-y-3 px-5 pb-5">
      <div className="flex items-center gap-3 rounded-xl border border-border-sage/80 bg-cream/30 p-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${invoice.avatarClass}`}
        >
          {invoice.initials}
        </div>
        <div className="min-w-0">
          <Link
            to={patientDetailPath(invoice.patientId)}
            className="truncate font-serif text-sm font-semibold text-sage-deep hover:underline"
          >
            {invoice.patientName}
          </Link>
          <p className="text-xs text-ink-ghost">#{invoice.patientId}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <DetailCell label="Treatment" value={invoice.treatment} />
        <DetailCell label="Doctor" value={invoice.doctor} />
        <DetailCell label="Due Date" value={invoice.dueDate} />
        <DetailCell label="Payment" value={invoice.paymentMethod ?? '—'} />
      </div>

      <div className="flex flex-col gap-2 pt-1 sm:flex-row">
        <Button
          className="w-full whitespace-nowrap rounded-xl py-2.5 text-sm sm:flex-[1.4]"
          onClick={onDownload}
        >
          <Download className="h-4 w-4 shrink-0" strokeWidth={2} />
          Download PDF
        </Button>
        <Button
          variant="secondary"
          className="w-full gap-1.5 whitespace-nowrap rounded-xl py-2.5 text-sm sm:flex-1"
          onClick={onEdit}
        >
          <SquarePen className="h-4 w-4 shrink-0" strokeWidth={2} />
          Edit
        </Button>
      </div>

      {invoice.status !== 'Paid' ? (
        <Button
          variant="secondary"
          className="w-full gap-1.5 rounded-xl py-2.5 text-sm"
          onClick={onSendReminder}
        >
          <Mail className="h-4 w-4 shrink-0" strokeWidth={2} />
          Send Reminder
        </Button>
      ) : null}
    </div>
  </div>
);
