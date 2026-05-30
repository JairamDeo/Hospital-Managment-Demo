import { Download, Eye } from 'lucide-react';
import type { Invoice } from '@/pages/billing/data/mockBilling';
import { formatRupee } from '@/pages/billing/data/mockBilling';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';

interface Props {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onDownload: (invoice: Invoice) => void;
}

export const InvoiceTable = ({ invoices, onView, onDownload }: Props) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[720px] border-collapse">
      <thead>
        <tr className="border-b border-border-sage bg-cream/50">
          {['Invoice', 'Patient', 'Date', 'Treatment', 'Amount', 'Status', 'Actions'].map((col) => (
            <th
              key={col}
              className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-ink-ghost"
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {invoices.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-4 py-10 text-center text-sm text-ink-soft">
              No invoices found
            </td>
          </tr>
        ) : (
          invoices.map((inv) => (
            <tr
              key={inv.id}
              className="border-b border-border-sage/80 transition-colors last:border-b-0 hover:bg-sage-mist/40"
            >
              <td className="px-4 py-3 text-sm font-semibold text-sage-deep">#{inv.id}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${inv.avatarClass}`}
                  >
                    {inv.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{inv.patientName}</p>
                    <p className="text-[11px] text-ink-ghost">{inv.patientId}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-ink-soft">{inv.date}</td>
              <td className="px-4 py-3 text-sm text-ink-soft">{inv.treatment}</td>
              <td className="px-4 py-3 text-sm font-semibold text-ink">
                {formatRupee(inv.amount)}
              </td>
              <td className="px-4 py-3">
                <InvoiceStatusBadge status={inv.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onView(inv)}
                    className="cursor-pointer rounded-lg p-2 text-ink-ghost hover:bg-sage-mist hover:text-ink-soft"
                    aria-label={`View ${inv.id}`}
                  >
                    <Eye className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDownload(inv)}
                    className="cursor-pointer rounded-lg p-2 text-ink-ghost hover:bg-sage-mist hover:text-ink-soft"
                    aria-label={`Download ${inv.id}`}
                  >
                    <Download className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);
