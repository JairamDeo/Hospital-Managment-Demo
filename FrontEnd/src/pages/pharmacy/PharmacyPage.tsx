import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Leaf,
  Loader2,
  Plus,
  Siren,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AddPharmacyItemModal } from '@/components/modals/AddPharmacyItemModal';
import { ImportPharmacyModal } from '@/components/modals/ImportPharmacyModal';
import { ExportPharmacyMenu } from '@/components/pharmacy/ExportPharmacyMenu';
import { PharmacyStatCard } from '@/components/pharmacy/PharmacyStatCard';
import { InventoryTable } from '@/components/pharmacy/InventoryTable';
import { PharmacyInventoryFilters } from '@/components/pharmacy/PharmacyInventoryFilters';
import { StockAlertsPanel } from '@/components/pharmacy/StockAlertsPanel';
import { MonthlyUsagePanel } from '@/components/pharmacy/MonthlyUsagePanel';
import { StaffPagination } from '@/components/staff/StaffPagination';
import { useToast } from '@/hooks/useToast';
import { pharmacyService } from '@/services/pharmacy/pharmacy.service';
import { masterService } from '@/services/master/master.service';
import { getApiErrorMessage } from '@/utils/helpers';
import { getPharmacyItemIcon } from '@/utils/pharmacyIcon';
import type { MasterItem } from '@/types/api.types';
import type {
  MonthlyUsageItem,
  PharmacyItemApi,
  PharmacyItemFormValues,
  PharmacyItemView,
  PharmacyImportSummary,
  PharmacyPagination,
  PharmacyStats,
  PharmacyStockFilter,
  StockAlert,
} from '@/types/pharmacy.types';
import { emptyPharmacyItemForm, PHARMACY_PAGE_SIZE } from '@/types/pharmacy.types';

const mapItem = (api: PharmacyItemApi): PharmacyItemView => ({
  ...api,
  id: api.itemCode,
  icon: getPharmacyItemIcon(api.name, api.category),
});

const defaultPagination = (): PharmacyPagination => ({
  page: 1,
  limit: PHARMACY_PAGE_SIZE,
  total: 0,
  totalPages: 1,
});

export const PharmacyPage = () => {
  const [items, setItems] = useState<PharmacyItemView[]>([]);
  const [pagination, setPagination] = useState<PharmacyPagination>(defaultPagination);
  const [stats, setStats] = useState<PharmacyStats>({ totalItems: 0, lowStock: 0, critical: 0 });
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [monthlyUsage, setMonthlyUsage] = useState<MonthlyUsageItem[]>([]);
  const [categories, setCategories] = useState<MasterItem[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [units, setUnits] = useState<MasterItem[]>([]);
  const [defaultSpoonGrams, setDefaultSpoonGrams] = useState(1.5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<PharmacyStockFilter>('all');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importSummary, setImportSummary] = useState<PharmacyImportSummary | null>(null);
  const [formInitial, setFormInitial] = useState(emptyPharmacyItemForm());
  const { showToast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, stockFilter, categoryId, brand]);

  const applyOverview = useCallback(
    (data: {
      items?: PharmacyItemApi[];
      pagination?: PharmacyPagination;
      stats?: PharmacyStats;
      alerts?: StockAlert[];
      monthlyUsage?: MonthlyUsageItem[];
      filterOptions?: { brands?: string[] };
    }) => {
      if (data.items) setItems(data.items.map(mapItem));
      if (data.pagination) setPagination(data.pagination);
      if (data.stats) setStats(data.stats);
      if (data.alerts) setAlerts(data.alerts);
      if (data.monthlyUsage) setMonthlyUsage(data.monthlyUsage);
      if (data.filterOptions?.brands) setBrands(data.filterOptions.brands);
    },
    []
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, categoriesRes, unitsRes, spoonsRes] = await Promise.all([
        pharmacyService.getOverview({
          page,
          limit: PHARMACY_PAGE_SIZE,
          search: debouncedSearch,
          stockFilter,
          categoryId: categoryId || undefined,
          brand: brand || undefined,
        }),
        masterService.listPharmacyCategories(true),
        masterService.listPharmacyUnits(true),
        masterService.listPharmacySpoons(true),
      ]);
      applyOverview(overviewRes.data.res ?? {});
      setCategories(categoriesRes.data.res?.items ?? []);
      setUnits(unitsRes.data.res?.items ?? []);
      const spoons = spoonsRes.data.res?.items ?? [];
      const defaultSpoon = spoons.find((s) => s.isDefault) ?? spoons[0];
      setDefaultSpoonGrams(defaultSpoon?.grams ?? 1.5);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [applyOverview, brand, categoryId, debouncedSearch, page, showToast, stockFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      await pharmacyService.exportCsv();
      showToast('CSV export downloaded', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      await pharmacyService.exportPdf();
      showToast('PDF export downloaded', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await pharmacyService.downloadImportTemplate();
      showToast('Template downloaded', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const handleImportFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      showToast('Only CSV files are allowed for import', 'error');
      return;
    }
    setImporting(true);
    try {
      const { data } = await pharmacyService.importCsv(file);
      applyOverview(data.res ?? {});
      setImportSummary(data.res?.summary ?? null);
      setPage(1);
      setSearch('');
      setDebouncedSearch('');
      setStockFilter('all');
      setCategoryId('');
      setBrand('');
      const s = data.res?.summary;
      showToast(
        data.message ||
          `Import done: ${s?.created ?? 0} created, ${s?.updated ?? 0} updated`,
        s?.failed ? 'error' : 'success'
      );
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleAdd = async (values: PharmacyItemFormValues) => {
    setSaving(true);
    try {
      const { data } = await pharmacyService.createItem(values);
      applyOverview(data.res ?? {});
      if (values.itemType === 'unit' && values.itemLabel.trim()) {
        const unitsRes = await masterService.listPharmacyUnits(true);
        setUnits(unitsRes.data.res?.items ?? []);
      }
      setPage(1);
      setSearch('');
      setDebouncedSearch('');
      setStockFilter('all');
      setCategoryId('');
      setBrand('');
      setModalOpen(false);
      showToast(data.message || `${values.name.trim()} added to inventory`, 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const openAddModal = () => {
    setFormInitial(emptyPharmacyItemForm());
    setModalOpen(true);
  };

  const activeCategories = categories.filter((c) => c.active !== false);

  const resetPage = () => setPage(1);

  const { total, totalPages, page: currentPage } = pagination;
  const from = total ? (currentPage - 1) * PHARMACY_PAGE_SIZE + 1 : 0;
  const to = Math.min(currentPage * PHARMACY_PAGE_SIZE, total);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-3 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-sage-deep sm:text-[1.75rem]">
            Herb & Medicine Inventory
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {stats.totalItems} items · {stats.lowStock} low stock · {stats.critical} critical alerts
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <ExportPharmacyMenu
            onExportCsv={handleExportCsv}
            onExportPdf={handleExportPdf}
            disabled={exporting}
          />
          <Button
            variant="secondary"
            className="gap-2 rounded-lg px-4 py-2"
            onClick={() => {
              setImportSummary(null);
              setImportOpen(true);
            }}
          >
            <Upload className="h-4 w-4" strokeWidth={1.75} />
            Import
          </Button>
          <Button className="gap-2 rounded-lg px-4 py-2" onClick={openAddModal}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Add Inventory Item
          </Button>
        </div>
      </div>

      <div className="mb-3 grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-3">
        <PharmacyStatCard
          label="Total Items"
          value={stats.totalItems}
          subLabel="In inventory"
          icon={Leaf}
          iconClass="bg-success-bg text-success"
        />
        <PharmacyStatCard
          label="Low Stock"
          value={stats.lowStock}
          subLabel="Below comfortable level"
          icon={AlertTriangle}
          iconClass="bg-warning-bg text-warning"
        />
        <PharmacyStatCard
          label="Critical"
          value={stats.critical}
          subLabel="Needs attention"
          icon={Siren}
          iconClass="bg-danger-bg text-danger"
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[1fr_280px]">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border-sage bg-white shadow-sm">
          <div className="relative z-20 shrink-0 overflow-visible border-b border-border-sage p-4">
            <PharmacyInventoryFilters
              search={search}
              onSearchChange={(v) => {
                setSearch(v);
                resetPage();
              }}
              stockFilter={stockFilter}
              onStockFilterChange={(v) => {
                setStockFilter(v);
                resetPage();
              }}
              categoryId={categoryId}
              onCategoryChange={(id) => {
                setCategoryId(id);
                resetPage();
              }}
              brand={brand}
              onBrandChange={(v) => {
                setBrand(v);
                resetPage();
              }}
              categories={activeCategories}
              brands={brands}
              stats={stats}
            />
          </div>
          <div className="scrollbar-thin relative min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-soft">
                <Loader2 className="h-5 w-5 animate-spin text-sage-deep" />
                Loading inventory…
              </div>
            ) : (
              <InventoryTable items={items} />
            )}
          </div>
          {!loading && total > 0 ? (
            <StaffPagination
              from={from}
              to={to}
              total={total}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              entityLabel="items"
            />
          ) : null}
        </div>

        <aside className="flex min-h-0 flex-col gap-3 overflow-hidden">
          <StockAlertsPanel alerts={alerts} className="min-h-0 flex-1" />
          <MonthlyUsagePanel items={monthlyUsage} className="min-h-0 flex-1" />
        </aside>
      </div>

      <AddPharmacyItemModal
        key={modalOpen ? 'open' : 'closed'}
        open={modalOpen}
        initial={formInitial}
        categories={categories}
        units={units}
        defaultSpoonGrams={defaultSpoonGrams}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAdd}
      />

      <ImportPharmacyModal
        open={importOpen}
        uploading={importing}
        lastSummary={importSummary}
        onClose={() => setImportOpen(false)}
        onDownloadTemplate={handleDownloadTemplate}
        onImport={handleImportFile}
      />
    </div>
  );
};

export default PharmacyPage;
