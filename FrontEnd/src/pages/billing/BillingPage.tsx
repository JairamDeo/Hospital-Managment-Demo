import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BillingStatCard } from '@/components/billing/BillingStatCard';
import { InvoiceTable } from '@/components/billing/InvoiceTable';
import { PaymentMethodsPanel } from '@/components/billing/PaymentMethodsPanel';
import { MedicineBillModal } from '@/components/billing/MedicineBillModal';
import { StaffPagination } from '@/components/staff/StaffPagination';
import { useToast } from '@/hooks/useToast';
import { invoiceDetailPath } from '@/constants/routes';
import { billingAdminService } from '@/services/billing/billingAdmin.service';
import { getApiErrorMessage } from '@/utils/helpers';
import {
  formatRupee,
  formatRupeeCompact,
  type BillingStats,
  type Invoice,
  type InvoiceFilter,
} from '@/types/billing.types';
import { Banknote, CheckCircle2, Clock, TriangleAlert } from 'lucide-react';

const PAGE_SIZE = 6;

export const BillingPage = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<InvoiceFilter>('all');
  const [feeFilter, setFeeFilter] = useState<'all' | 'Consultation' | 'Medicine'>('all');
  const [page, setPage] = useState(1);
  const [medicineModalOpen, setMedicineModalOpen] = useState(false);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        billingAdminService.list({
          status: filter,
          feeType: feeFilter === 'all' ? undefined : feeFilter,
          search: search.trim() || undefined,
        }),
        billingAdminService.getStats(),
      ]);
      setInvoices(listRes.data.res?.invoices ?? []);
      setStats(statsRes.data.res?.stats ?? null);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [filter, feeFilter, search, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(invoices.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageInvoices = invoices.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const from = invoices.length ? (safePage - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(safePage * PAGE_SIZE, invoices.length);

  const statCards = useMemo(
    () => [
      {
        label: 'Total Revenue',
        value: formatRupeeCompact(stats?.totalRevenue ?? 0),
        subLabel: `${stats?.invoiceCount ?? 0} invoices`,
        icon: Banknote,
        iconClass: 'bg-success-bg text-success',
        subClass: 'text-ink-soft',
      },
      {
        label: 'Collected',
        value: formatRupeeCompact(stats?.collected ?? 0),
        subLabel: `${stats?.collectionRate ?? 0}% collection rate`,
        icon: CheckCircle2,
        iconClass: 'bg-success-bg text-success',
        subClass: 'text-success',
      },
      {
        label: 'Pending',
        value: formatRupeeCompact(stats?.pending ?? 0),
        subLabel: `${stats?.pendingCount ?? 0} awaiting payment`,
        icon: Clock,
        iconClass: 'bg-warning-bg text-warning',
        subClass: 'text-warning',
      },
      {
        label: 'Overdue',
        value: formatRupeeCompact(stats?.overdue ?? 0),
        subLabel: `${stats?.overdueCount ?? 0} overdue bills`,
        icon: TriangleAlert,
        iconClass: 'bg-danger-bg text-danger',
        subClass: 'text-danger',
      },
    ],
    [stats]
  );

  const filters: { id: InvoiceFilter; label: string; activeClass: string }[] = [
    { id: 'all', label: 'All', activeClass: 'border-sage-deep bg-sage-mist text-sage-deep' },
    { id: 'paid', label: 'Paid', activeClass: 'border-success/30 bg-success-bg text-success' },
    { id: 'pending', label: 'Pending', activeClass: 'border-warning/40 bg-warning-bg text-warning' },
    { id: 'overdue', label: 'Overdue', activeClass: 'border-danger/40 bg-danger-bg text-danger' },
  ];

  const feeFilters: { id: typeof feeFilter; label: string }[] = [
    { id: 'all', label: 'All types' },
    { id: 'Consultation', label: 'Consultation' },
    { id: 'Medicine', label: 'Medicine' },
  ];

  return (
    <div className="pb-6">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-sage-deep sm:text-[1.75rem]">
            Billing & Invoices
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Consultation fees (on visit) and medicine fees (pharmacy)
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            className="gap-2 rounded-lg px-4 py-2"
            onClick={() => setMedicineModalOpen(true)}
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Medicine Bill
          </Button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((card) => (
          <BillingStatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_280px]">
        <div className="overflow-hidden rounded-xl border border-border-sage bg-white shadow-sm">
          <div className="border-b border-border-sage p-4">
            <div className="flex flex-col gap-3">
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
                <span className="mx-1 hidden h-4 w-px bg-border-sage sm:inline" />
                {feeFilters.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setFeeFilter(f.id);
                      setPage(1);
                    }}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      feeFilter === f.id
                        ? 'border-sage-deep bg-sage-mist text-sage-deep'
                        : 'border-border-sage bg-white text-ink-soft hover:bg-sage-mist/60'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <p className="px-4 py-10 text-center text-sm text-ink-soft">Loading invoices…</p>
          ) : (
            <InvoiceTable
              invoices={pageInvoices}
              onView={(inv) => navigate(invoiceDetailPath(inv.id))}
            />
          )}

          <StaffPagination
            from={from}
            to={to}
            total={invoices.length}
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
            entityLabel="invoices"
          />
        </div>

        <aside className="flex flex-col gap-3">
          <PaymentMethodsPanel methods={stats?.paymentMethods ?? []} />
          <div className="rounded-xl border border-border-sage bg-white p-4 text-sm text-ink-soft">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
              How billing works
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1.5 text-xs">
              <li>
                <strong className="font-semibold text-ink">Consultation</strong> — doctor enters the
                visit fee when marking a patient as attended.
              </li>
              <li>
                <strong className="font-semibold text-ink">Medicine</strong> — support staff creates
                a bill when dispensing pharmacy items.
              </li>
              <li>Collect payment from the invoice detail page.</li>
            </ul>
          </div>
        </aside>
      </div>

      <MedicineBillModal
        open={medicineModalOpen}
        onClose={() => setMedicineModalOpen(false)}
        onCreated={() => {
          setMedicineModalOpen(false);
          void load();
        }}
      />
    </div>
  );
};

export default BillingPage;
