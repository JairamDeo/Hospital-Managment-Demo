import { Eye } from 'lucide-react';
import type { Invoice } from '@/types/billing.types';
import { formatRupee } from '@/types/billing.types';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';

interface Props {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
}

export const InvoiceTable = ({ invoices, onView }: Props) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[720px] border-collapse">
      <thead>
        <tr className="border-b border-border-sage bg-cream/50">
          {['Invoice', 'Patient', 'Date', 'Type', 'Description', 'Amount', 'Status', 'Actions'].map((col) => (
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
            <td colSpan={8} className="px-4 py-10 text-center text-sm text-ink-soft">
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
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    inv.feeType === 'Medicine'
                      ? 'bg-violet-100 text-violet-700'
                      : inv.feeType === 'Panchakarma'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  {inv.feeType}
                </span>
              </td>
              <td className="max-w-[180px] truncate px-4 py-3 text-sm text-ink-soft" title={inv.treatment}>
                {inv.treatment}
              </td>
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
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);
