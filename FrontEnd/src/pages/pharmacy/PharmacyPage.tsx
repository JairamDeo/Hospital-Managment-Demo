import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Leaf,
  Package,
  Plus,
  Search,
  Siren,
  Sprout,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AddPharmacyItemModal } from '@/components/modals/AddPharmacyItemModal';
import { PharmacyStatCard } from '@/components/pharmacy/PharmacyStatCard';
import { InventoryTable } from '@/components/pharmacy/InventoryTable';
import { StockAlertsPanel } from '@/components/pharmacy/StockAlertsPanel';
import { MonthlyUsagePanel } from '@/components/pharmacy/MonthlyUsagePanel';
import { useToast } from '@/hooks/useToast';
import {
  MOCK_INVENTORY,
  MOCK_MONTHLY_USAGE,
  MOCK_STOCK_ALERTS,
  PHARMACY_STATS,
  emptyPharmacyItemForm,
  getStockStatus,
  type InventoryFilter,
  type PharmacyItem,
  type PharmacyItemFormValues,
} from './data/mockPharmacy';

export const PharmacyPage = () => {
  const [items, setItems] = useState<PharmacyItem[]>(MOCK_INVENTORY);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<InventoryFilter>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [formInitial, setFormInitial] = useState(emptyPharmacyItemForm());
  const { showToast } = useToast();

  const filtered = useMemo(() => {
    let list = [...items];
    if (filter === 'critical') list = list.filter((i) => i.status === 'Critical');
    if (filter === 'low') list = list.filter((i) => i.status === 'Low');
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.subtitle.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, search, filter]);

  const handleReorder = (item: PharmacyItem) => {
    showToast(`Reorder placed for ${item.name}`, 'success');
  };

  const handleImport = () => {
    showToast('Import feature coming soon', 'success');
  };

  const handleAdd = (values: PharmacyItemFormValues) => {
    const level = Math.round((values.stock / values.maxStock) * 100);
    const status = getStockStatus(level);
    const newItem: PharmacyItem = {
      id: `PH-${String(items.length + 1).padStart(3, '0')}`,
      name: values.name.trim(),
      subtitle: `${values.category} · New`,
      category: values.category,
      stock: values.stock,
      maxStock: values.maxStock,
      level,
      status,
      icon: Sprout,
    };
    setItems((prev) => [newItem, ...prev]);
    setModalOpen(false);
    showToast(`${newItem.name} added to inventory`, 'success');
  };

  const filters: { id: InventoryFilter; label: string; activeClass?: string }[] = [
    { id: 'critical', label: `Critical (${PHARMACY_STATS.critical})`, activeClass: 'border-danger/40 bg-danger-bg text-danger' },
    { id: 'low', label: 'Low Stock', activeClass: 'border-warning/40 bg-warning-bg text-warning' },
    { id: 'all', label: 'All Items', activeClass: 'border-sage-deep bg-sage-mist text-sage-deep' },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-3 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-sage-deep sm:text-[1.75rem]">
            Herb & Medicine Inventory
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {PHARMACY_STATS.totalItems} items · {PHARMACY_STATS.lowStock} low stock ·{' '}
            {PHARMACY_STATS.critical} critical alerts
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="secondary" className="gap-2 rounded-lg px-4 py-2" onClick={handleImport}>
            <Upload className="h-4 w-4" strokeWidth={1.75} />
            Import
          </Button>
          <Button
            className="gap-2 rounded-lg px-4 py-2"
            onClick={() => {
              setFormInitial(emptyPharmacyItemForm());
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Add Item
          </Button>
        </div>
      </div>

      <div className="mb-3 grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
        <PharmacyStatCard
          label="Total Items"
          value={PHARMACY_STATS.totalItems}
          subLabel="In inventory"
          icon={Leaf}
          iconClass="bg-success-bg text-success"
        />
        <PharmacyStatCard
          label="Low Stock"
          value={PHARMACY_STATS.lowStock}
          subLabel="Need reorder"
          icon={AlertTriangle}
          iconClass="bg-warning-bg text-warning"
        />
        <PharmacyStatCard
          label="Critical"
          value={PHARMACY_STATS.critical}
          subLabel="Urgent reorder"
          icon={Siren}
          iconClass="bg-danger-bg text-danger"
        />
        <PharmacyStatCard
          label="Pending Orders"
          value={PHARMACY_STATS.pendingOrders}
          subLabel="In transit"
          icon={Package}
          iconClass="bg-amber-100 text-amber-800"
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[1fr_280px]">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border-sage bg-white shadow-sm">
          <div className="shrink-0 border-b border-border-sage p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative max-w-md flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-ghost"
                  strokeWidth={1.75}
                />
                <input
                  type="search"
                  placeholder="Search medicines..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-full border border-border-sage bg-white py-2 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-ink-ghost focus:border-sage focus:ring-2 focus:ring-sage-pale"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {filters.map((f) => {
                  const active = filter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilter(f.id)}
                      className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? f.activeClass
                          : 'border-border-sage bg-white text-ink-soft hover:bg-sage-mist/60'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
            <InventoryTable items={filtered} onReorder={handleReorder} />
          </div>
        </div>

        <aside className="flex min-h-0 flex-col gap-3 overflow-hidden">
          <StockAlertsPanel alerts={MOCK_STOCK_ALERTS} className="min-h-0 flex-1" />
          <MonthlyUsagePanel items={MOCK_MONTHLY_USAGE} className="min-h-0 flex-1" />
        </aside>
      </div>

      <AddPharmacyItemModal
        key={modalOpen ? 'open' : 'closed'}
        open={modalOpen}
        initial={formInitial}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAdd}
      />
    </div>
  );
};

export default PharmacyPage;
