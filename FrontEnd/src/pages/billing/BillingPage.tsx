import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BillingStatCard, billingStatCards } from '@/components/billing/BillingStatCard';
import { InvoiceTable } from '@/components/billing/InvoiceTable';
import { PaymentMethodsPanel } from '@/components/billing/PaymentMethodsPanel';
import { InsuranceClaimsPanel } from '@/components/billing/InsuranceClaimsPanel';
import { StaffPagination } from '@/components/staff/StaffPagination';
import { useToast } from '@/hooks/useToast';
import { invoiceDetailPath } from '@/constants/routes';
import {
  BILLING_STATS,
  INSURANCE_CLAIMS,
  MOCK_INVOICES,
  PAYMENT_METHODS,
  type Invoice,
  type InvoiceFilter,
} from './data/mockBilling';

const PAGE_SIZE = 6;

const statusFilter = (filter: InvoiceFilter, status: Invoice['status']) => {
  if (filter === 'all') return true;
  if (filter === 'paid') return status === 'Paid';
  if (filter === 'pending') return status === 'Pending';
  return status === 'Overdue';
};

export const BillingPage = () => {
  const navigate = useNavigate();
  const [invoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<InvoiceFilter>('all');
  const [page, setPage] = useState(1);
  const { showToast } = useToast();

  const filtered = useMemo(() => {
    let list = invoices.filter((inv) => statusFilter(filter, inv.status));
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (inv) =>
          inv.id.toLowerCase().includes(q) ||
          inv.patientName.toLowerCase().includes(q) ||
          inv.treatment.toLowerCase().includes(q) ||
          inv.patientId.toLowerCase().includes(q)
      );
    }
    return list;
  }, [invoices, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageInvoices = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const from = filtered.length ? (safePage - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(safePage * PAGE_SIZE, filtered.length);

  const filters: { id: InvoiceFilter; label: string; activeClass: string }[] = [
    { id: 'all', label: 'All', activeClass: 'border-sage-deep bg-sage-mist text-sage-deep' },
    { id: 'paid', label: 'Paid', activeClass: 'border-success/30 bg-success-bg text-success' },
    { id: 'pending', label: 'Pending', activeClass: 'border-warning/40 bg-warning-bg text-warning' },
    { id: 'overdue', label: 'Overdue', activeClass: 'border-danger/40 bg-danger-bg text-danger' },
  ];

  return (
    <div className="pb-6">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-sage-deep sm:text-[1.75rem]">
            Billing & Invoices
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            October 2023 · {BILLING_STATS.invoiceCount} invoices generated
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            className="gap-2 rounded-lg px-4 py-2"
            onClick={() => showToast('Export started', 'success')}
          >
            <Upload className="h-4 w-4" strokeWidth={1.75} />
            Export
          </Button>
          <Button
            className="gap-2 rounded-lg px-4 py-2"
            onClick={() => showToast('New invoice form coming soon', 'success')}
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            New Invoice
          </Button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {billingStatCards.map((card) => (
          <BillingStatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_280px]">
        <div className="overflow-hidden rounded-xl border border-border-sage bg-white shadow-sm">
          <div className="border-b border-border-sage p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative max-w-md flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-ghost"
                  strokeWidth={1.75}
                />
                <input
                  type="search"
                  placeholder="Search invoices..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-full border border-border-sage bg-white py-2 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-ink-ghost focus:border-sage focus:ring-2 focus:ring-sage-pale"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {filters.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setFilter(f.id);
                      setPage(1);
                    }}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      filter === f.id
                        ? f.activeClass
                        : 'border-border-sage bg-white text-ink-soft hover:bg-sage-mist/60'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <InvoiceTable
            invoices={pageInvoices}
            onView={(inv) => navigate(invoiceDetailPath(inv.id))}
            onDownload={(inv) => showToast(`Downloading ${inv.id}`, 'success')}
          />

          <StaffPagination
            from={from}
            to={to}
            total={filtered.length}
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
            entityLabel="invoices"
          />
        </div>

        <aside className="flex flex-col gap-3">
          <PaymentMethodsPanel methods={PAYMENT_METHODS} />
          <InsuranceClaimsPanel claims={INSURANCE_CLAIMS} />
        </aside>
      </div>
    </div>
  );
};

export default BillingPage;
