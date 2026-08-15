import { useRef, useState } from 'react';
import {
  Building2,
  Check,
  ChevronDown,
  Layers,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { PopoverMenu } from '@/components/ui/PopoverMenu';
import type { MasterItem } from '@/types/api.types';
import type { PharmacyStats, PharmacyStockFilter } from '@/types/pharmacy.types';

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  stockFilter: PharmacyStockFilter;
  onStockFilterChange: (value: PharmacyStockFilter) => void;
  categoryId: string;
  onCategoryChange: (id: string) => void;
  brand: string;
  onBrandChange: (value: string) => void;
  categories: MasterItem[];
  brands: string[];
  stats: PharmacyStats;
}

const STOCK_FILTERS: {
  id: PharmacyStockFilter;
  label: string;
  count?: (s: PharmacyStats) => number;
  activeClass: string;
}[] = [
  {
    id: 'critical',
    label: 'Critical',
    count: (s) => s.critical,
    activeClass: 'border-danger/50 bg-danger-bg text-danger shadow-sm',
  },
  {
    id: 'low',
    label: 'Low Stock',
    activeClass: 'border-warning/50 bg-warning-bg text-warning shadow-sm',
  },
  {
    id: 'all',
    label: 'All Items',
    activeClass: 'border-sage-deep bg-sage-deep text-white shadow-sm',
  },
];

export const PharmacyInventoryFilters = ({
  search,
  onSearchChange,
  stockFilter,
  onStockFilterChange,
  categoryId,
  onCategoryChange,
  brand,
  onBrandChange,
  categories,
  brands,
  stats,
}: Props) => {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const categoryRef = useRef<HTMLButtonElement>(null);
  const brandRef = useRef<HTMLButtonElement>(null);

  const selectedCategory = categories.find((c) => c._id === categoryId);
  const hasRefine = Boolean(categoryId || brand);

  const clearRefine = () => {
    onCategoryChange('');
    onBrandChange('');
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-ghost"
          strokeWidth={1.75}
        />
        <input
          type="search"
          placeholder="Search medicines, codes, brands..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-xl border border-border-sage bg-white py-2.5 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-ink-ghost focus:border-sage focus:ring-2 focus:ring-sage-pale"
        />
      </div>

      <div className="rounded-xl border border-border-sage/80 bg-gradient-to-br from-cream/80 to-white p-3 shadow-sm">
        <div className="flex flex-row flex-wrap items-start gap-3 sm:items-center sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
              <SlidersHorizontal className="h-3 w-3 shrink-0" strokeWidth={2} />
              Stock status
            </div>
            <div className="flex flex-wrap gap-2">
              {STOCK_FILTERS.map((f) => {
                const active = stockFilter === f.id;
                const count = f.count?.(stats);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onStockFilterChange(f.id)}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? f.activeClass
                        : 'border-border-sage bg-white text-ink-soft hover:border-sage/40 hover:bg-sage-mist/50'
                    }`}
                  >
                    {f.id === 'all' && active ? (
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                    ) : null}
                    {f.label}
                    {count !== undefined && count > 0 ? (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                          active ? 'bg-white/25' : 'bg-sage-mist text-sage-deep'
                        }`}
                      >
                        {count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hidden h-10 w-px shrink-0 bg-border-sage/70 sm:block" aria-hidden />

          <div className="min-w-[min(100%,220px)] shrink-0 sm:ml-auto">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
              <Layers className="h-3 w-3 shrink-0" strokeWidth={2} />
              Refine by
            </div>

            <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <button
              ref={categoryRef}
              type="button"
              onClick={() => {
                setBrandOpen(false);
                setCategoryOpen((v) => !v);
              }}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                categoryId
                  ? 'border-sage-deep bg-sage-mist text-sage-deep'
                  : 'border-border-sage bg-white text-ink-soft hover:bg-sage-mist/50'
              }`}
            >
              <Layers className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
              <span className="max-w-[120px] truncate">
                {selectedCategory ? selectedCategory.name : 'Category'}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 transition-transform ${categoryOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <PopoverMenu
              open={categoryOpen}
              onClose={() => setCategoryOpen(false)}
              anchorRef={categoryRef}
              align="start"
              className="py-2"
            >
              <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                Category
              </p>
              <div className="scrollbar-thin max-h-52 overflow-y-auto px-2">
                <FilterOption
                  label="All categories"
                  active={!categoryId}
                  onClick={() => {
                    onCategoryChange('');
                    setCategoryOpen(false);
                  }}
                />
                {categories.map((c) => (
                  <FilterOption
                    key={c._id}
                    label={c.name}
                    active={categoryId === c._id}
                    onClick={() => {
                      onCategoryChange(c._id);
                      setCategoryOpen(false);
                    }}
                  />
                ))}
              </div>
            </PopoverMenu>
          </div>

          <div className="relative">
            <button
              ref={brandRef}
              type="button"
              onClick={() => {
                setCategoryOpen(false);
                setBrandOpen((v) => !v);
              }}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                brand
                  ? 'border-sage-deep bg-sage-mist text-sage-deep'
                  : 'border-border-sage bg-white text-ink-soft hover:bg-sage-mist/50'
              }`}
            >
              <Building2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
              <span className="max-w-[120px] truncate">{brand || 'Brand'}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 transition-transform ${brandOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <PopoverMenu
              open={brandOpen}
              onClose={() => setBrandOpen(false)}
              anchorRef={brandRef}
              align="end"
              className="py-2"
            >
              <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                Brand / Company
              </p>
              <div className="scrollbar-thin max-h-52 overflow-y-auto px-2">
                <FilterOption
                  label="All brands"
                  active={!brand}
                  onClick={() => {
                    onBrandChange('');
                    setBrandOpen(false);
                  }}
                />
                {brands.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-ink-ghost">No brands in inventory yet</p>
                ) : (
                  brands.map((b) => (
                    <FilterOption
                      key={b}
                      label={b}
                      active={brand === b}
                      onClick={() => {
                        onBrandChange(b);
                        setBrandOpen(false);
                      }}
                    />
                  ))
                )}
              </div>
            </PopoverMenu>
          </div>

          {hasRefine ? (
            <button
              type="button"
              onClick={clearRefine}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-1.5 text-xs font-semibold text-ink-ghost transition-colors hover:bg-sage-mist hover:text-ink"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
              Clear
            </button>
          ) : null}
            </div>
          </div>
        </div>

        {hasRefine ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-border-sage/50 pt-2.5 lg:mt-2">
            {selectedCategory ? (
              <ActiveTag label={selectedCategory.name} onRemove={() => onCategoryChange('')} />
            ) : null}
            {brand ? <ActiveTag label={brand} onRemove={() => onBrandChange('')} /> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const FilterOption = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
      active ? 'bg-sage-mist font-semibold text-sage-deep' : 'text-ink-soft hover:bg-sage-mist/50 hover:text-ink'
    }`}
  >
    <span className="truncate">{label}</span>
    {active ? <Check className="h-4 w-4 shrink-0 text-sage-deep" strokeWidth={2} /> : null}
  </button>
);

const ActiveTag = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-sage/30 bg-sage-mist/80 py-0.5 pl-2.5 pr-1 text-xs font-medium text-sage-deep">
    {label}
    <button
      type="button"
      onClick={onRemove}
      className="cursor-pointer rounded-full p-0.5 hover:bg-white/80"
      aria-label={`Remove ${label} filter`}
    >
      <X className="h-3 w-3" strokeWidth={2} />
    </button>
  </span>
);
