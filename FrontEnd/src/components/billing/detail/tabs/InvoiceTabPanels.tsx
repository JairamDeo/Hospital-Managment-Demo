import type { ReactNode } from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import type {
  InvoiceDetail,
  InvoiceDocument,
  InvoiceLineItem,
  PaymentRecord,
} from '@/pages/billing/data/mockInvoiceDetails';
import { formatRupee } from '@/pages/billing/data/mockBilling';

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

export const InvoiceInsuranceTab = ({ invoice }: { invoice: InvoiceDetail }) => (
  <div className="rounded-xl border border-border-sage bg-cream/30 p-5">
    {invoice.insuranceStatus === 'Not Applicable' ? (
      <p className="text-sm text-ink-soft">No insurance claim linked to this invoice.</p>
    ) : (
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">Provider</p>
          <p className="mt-1 text-sm font-semibold text-ink">{invoice.insuranceProvider}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">Claim ID</p>
          <p className="mt-1 text-sm font-semibold text-ink">{invoice.insuranceClaimId}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">Status</p>
          <p className="mt-1 text-sm font-semibold text-success">{invoice.insuranceStatus}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">Coverage</p>
          <p className="mt-1 text-sm font-semibold text-ink">{formatRupee(Math.round(invoice.amount * 0.6))}</p>
        </div>
      </div>
    )}
  </div>
);

export const InvoiceDocumentsTab = ({ documents }: { documents: InvoiceDocument[] }) => (
  <div className="space-y-2">
    {documents.map((doc) => (
      <div
        key={doc.id}
        className="flex items-center gap-3 rounded-xl border border-border-sage bg-cream/30 px-4 py-3 transition-colors hover:bg-sage-mist/40"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-sage-deep ring-1 ring-border-sage">
          <FileText className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{doc.name}</p>
          <p className="text-xs text-ink-ghost">
            {doc.type} · {doc.uploadedAt} · {doc.size}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            className="cursor-pointer rounded-lg p-2 text-ink-ghost hover:bg-white hover:text-ink-soft"
            aria-label={`View ${doc.name}`}
          >
            <Eye className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-lg p-2 text-ink-ghost hover:bg-white hover:text-ink-soft"
            aria-label={`Download ${doc.name}`}
          >
            <Download className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    ))}
  </div>
);
