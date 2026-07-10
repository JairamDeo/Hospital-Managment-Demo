import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NumericInput } from '@/components/ui/NumericInput';
import { formInputClass, formLabelClass, formSelectClass } from '@/components/ui/formStyles';
import { billingAdminService } from '@/services/billing/billingAdmin.service';
import { patientAdminService } from '@/services/patient/patientAdmin.service';
import { pharmacyService } from '@/services/pharmacy/pharmacy.service';
import { useToast } from '@/hooks/useToast';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useFormDraft } from '@/hooks/useFormDraft';
import { FormDraftPanel } from '@/components/ui/FormDraftPanel';
import { FORM_DRAFT_CATEGORIES, draftContextKeys } from '@/store/formDraftStorage';
import { getApiErrorMessage } from '@/utils/helpers';
import {
  PHARMACY_SEARCH_MAX_RESULTS,
  PHARMACY_SEARCH_MIN_CHARS,
  searchPharmacyItems,
} from '@/utils/pharmacySearch.util';
import { ROUTES } from '@/constants/routes';
import {
  formatRupee,
  OFFLINE_PAYMENT_METHOD_OPTIONS,
  type OfflinePaymentMethodType,
} from '@/types/billing.types';
import type { HmsPatient } from '@/types/api.types';
import type { PharmacyItemApi, SaleUnit } from '@/types/pharmacy.types';
import {
  allowsDecimalQty,
  convertSaleToBase,
  getDefaultSaleUnit,
  getSaleUnits,
  getStockBaseUnits,
  getUnitPrice,
  maxSaleQuantity,
  saleUnitLabel,
} from '@/utils/pharmacyStockUnits.util';

interface BillLineSelection {
  quantity: number;
  saleUnit: SaleUnit;
}

interface MedicineBillDraft {
  patientCode: string;
  search: string;
  selected: Record<string, BillLineSelection | number>;
  paymentMethod: OfflinePaymentMethodType;
}

const normalizeSelected = (
  raw: Record<string, BillLineSelection | number>
): Record<string, BillLineSelection> =>
  Object.fromEntries(
    Object.entries(raw).map(([code, value]) => [
      code,
      typeof value === 'number' ? { quantity: value, saleUnit: 'unit' } : value,
    ])
  );

export const MedicineBillPage = () => {
  const { showToast } = useToast();
  const [patients, setPatients] = useState<HmsPatient[]>([]);
  const [items, setItems] = useState<PharmacyItemApi[]>([]);
  const [patientCode, setPatientCode] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [selected, setSelected] = useState<Record<string, BillLineSelection>>({});
  const [paymentMethod, setPaymentMethod] = useState<OfflinePaymentMethodType>('Cash');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const buildDraftLabel = useCallback(
    (draft: MedicineBillDraft) => {
      const patient = patients.find((p) => p.patientCode === draft.patientCode);
      const count = Object.keys(draft.selected).length;
      const name = patient?.name ?? (draft.patientCode || 'No patient');
      return `${name} · ${count} medicine${count === 1 ? '' : 's'}`;
    },
    [patients]
  );

  const {
    drafts,
    hasDrafts,
    activeDraftId,
    saveDraft,
    saveNewDraft,
    restoreDraft,
    discardDraft,
    clearDraftAfterSubmit,
  } = useFormDraft<MedicineBillDraft>(FORM_DRAFT_CATEGORIES.medicineBill, {
    buildLabel: buildDraftLabel,
  });

  const draftPayload = (): MedicineBillDraft => ({
    patientCode,
    search,
    selected,
    paymentMethod,
  });

  const applyDraft = (draft: MedicineBillDraft) => {
    setPatientCode(draft.patientCode);
    setSearch(draft.search);
    setSelected(normalizeSelected(draft.selected));
    setPaymentMethod(draft.paymentMethod ?? 'Cash');
  };

  const handleSaveDraft = () => {
    saveDraft(draftPayload(), { contextKey: patientCode ? draftContextKeys.patient(patientCode) : 'unsaved' });
    showToast('Medicine bill draft saved', 'success');
  };

  const handleSaveNewDraft = () => {
    saveNewDraft(draftPayload(), { contextKey: patientCode ? draftContextKeys.patient(patientCode) : 'unsaved' });
    showToast('New draft saved', 'success');
  };

  const handleRestoreDraft = (id: string) => {
    const draft = restoreDraft(id);
    if (!draft) return;
    applyDraft(draft);
    showToast('Draft restored — continue editing', 'success');
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([patientAdminService.list(), pharmacyService.getBillingItems()])
      .then(([patRes, pharmRes]) => {
        setPatients(patRes.data.res?.patients ?? []);
        setItems(pharmRes.data.res?.items ?? []);
      })
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const searchQuery = debouncedSearch.trim();
  const searchResults = useMemo(
    () => searchPharmacyItems(items, debouncedSearch),
    [items, debouncedSearch]
  );
  const isSearching =
    search.trim() !== debouncedSearch.trim() && search.trim().length >= PHARMACY_SEARCH_MIN_CHARS;
  const showSearchPrompt = search.trim().length < PHARMACY_SEARCH_MIN_CHARS;
  const hasMoreResults = searchResults.length >= PHARMACY_SEARCH_MAX_RESULTS;

  const selectedLines = useMemo(
    () =>
      Object.entries(selected)
        .map(([itemCode, line]) => {
          const item = items.find((i) => i.itemCode === itemCode);
          if (!item || line.quantity <= 0) return null;
          const unitPrice = getUnitPrice(item, line.saleUnit);
          return { item, quantity: line.quantity, saleUnit: line.saleUnit, unitPrice };
        })
        .filter(Boolean) as Array<{
        item: PharmacyItemApi;
        quantity: number;
        saleUnit: SaleUnit;
        unitPrice: number;
      }>,
    [selected, items]
  );

  const total = selectedLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  const toggleItem = (item: PharmacyItemApi, checked: boolean) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (checked) {
        next[item.itemCode] = next[item.itemCode] ?? {
          quantity: 1,
          saleUnit: getDefaultSaleUnit(item),
        };
      } else {
        delete next[item.itemCode];
      }
      return next;
    });
  };

  const setLine = (itemCode: string, patch: Partial<BillLineSelection>) => {
    setSelected((prev) => {
      const current = prev[itemCode];
      if (!current) return prev;
      return { ...prev, [itemCode]: { ...current, ...patch } };
    });
  };

  const handleSubmit = async () => {
    if (!patientCode) {
      showToast('Select a patient', 'error');
      return;
    }
    if (!selectedLines.length) {
      showToast('Select at least one medicine', 'error');
      return;
    }
    for (const line of selectedLines) {
      if (line.unitPrice <= 0) {
        showToast(`Set sale price for ${line.item.name} in pharmacy first`, 'error');
        return;
      }
      const baseNeeded = convertSaleToBase(line.quantity, line.saleUnit, line.item);
      if (baseNeeded > getStockBaseUnits(line.item)) {
        showToast(`Insufficient stock for ${line.item.name}`, 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      await billingAdminService.createMedicineBill({
        patientCode,
        items: selectedLines.map((l) => ({
          itemCode: l.item.itemCode,
          quantity: l.quantity,
          saleUnit: l.saleUnit,
          unitPrice: l.unitPrice,
        })),
        markPaid: true,
        paymentMethod,
      });
      showToast('Medicine bill created', 'success');
      clearDraftAfterSubmit(patientCode ? draftContextKeys.patient(patientCode) : undefined);
      setSelected({});
      setPatientCode('');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl pb-8">
      <Link
        to={ROUTES.ADMIN_BILLING}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-sage-deep hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to billing
      </Link>

      <h1 className="font-serif text-2xl font-bold text-sage-deep">New medicine bill</h1>
      <p className="mt-1 text-sm text-ink-soft">Select medicines, set quantities, and collect payment</p>

      {loading ? (
        <p className="py-16 text-center text-sm text-ink-soft">Loading…</p>
      ) : (
        <div className="mt-5 space-y-4">
          {hasDrafts ? (
            <FormDraftPanel
              drafts={drafts}
              activeDraftId={activeDraftId}
              onRestore={handleRestoreDraft}
              onDiscard={(id) => {
                discardDraft(id);
                showToast('Draft discarded', 'success');
              }}
            />
          ) : null}

          <label className="block">
            <span className={formLabelClass}>Patient</span>
            <select
              value={patientCode}
              onChange={(e) => setPatientCode(e.target.value)}
              className={formSelectClass}
            >
              <option value="">Select patient…</option>
              {patients.map((p) => (
                <option key={p.patientCode} value={p.patientCode}>
                  {p.name} ({p.patientCode})
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-xl border border-border-sage bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-ink-ghost">Add medicines</p>
              {!showSearchPrompt && !isSearching ? (
                <p className="text-xs text-ink-ghost">
                  {searchResults.length} result{searchResults.length === 1 ? '' : 's'}
                  {hasMoreResults ? ' (refine search for more)' : ''}
                </p>
              ) : null}
            </div>

            <div className="relative mb-3">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-ghost"
                strokeWidth={1.75}
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, code, brand, or pack size…"
                className={`${formInputClass} pl-9 pr-9`}
                autoComplete="off"
              />
              {isSearching ? (
                <Loader2
                  className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-ghost"
                  strokeWidth={2}
                />
              ) : null}
            </div>

            <div className="max-h-72 overflow-y-auto rounded-lg border border-border-sage bg-cream/20">
              {showSearchPrompt ? (
                <p className="px-4 py-10 text-center text-sm text-ink-soft">
                  Type at least {PHARMACY_SEARCH_MIN_CHARS} characters to find medicines
                </p>
              ) : isSearching ? (
                <p className="px-4 py-10 text-center text-sm text-ink-soft">Searching…</p>
              ) : searchResults.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-ink-soft">
                  No medicines found for &ldquo;{searchQuery}&rdquo;
                </p>
              ) : (
                <ul className="divide-y divide-border-sage/60 bg-white">
                  {searchResults.map((item) => {
                    const checked = item.itemCode in selected;
                    const line = selected[item.itemCode];
                    const saleUnit = line?.saleUnit ?? getDefaultSaleUnit(item);
                    const disabled = getStockBaseUnits(item) < 0.01 || (item.salePrice ?? 0) <= 0;
                    const maxQty = maxSaleQuantity(item, saleUnit);
                    return (
                      <li key={item.itemCode} className="px-3 py-3">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={(e) => toggleItem(item, e.target.checked)}
                            className="mt-1"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-ink">{item.name}</p>
                            <p className="text-[11px] text-ink-ghost">
                              {item.itemCode}
                              {item.unitSize ? ` · ${item.unitSize}` : ''}
                              {item.company ? ` · ${item.company}` : ''}
                              {' · '}stock: {item.stockDisplay ?? item.stock}
                              {' · '}
                              {(item.salePrice ?? 0) > 0
                                ? item.itemType === 'weight' && item.pricePerGram
                                  ? `${formatRupee(item.pricePerGram)}/g · ${formatRupee(item.pricePerSpoon ?? 0)}/spoon`
                                  : item.itemType === 'strip' && item.pricePerTablet
                                    ? `${formatRupee(item.pricePerTablet)}/tablet · ${formatRupee(item.salePrice!)}/box`
                                    : `${formatRupee(item.salePrice!)}/pack`
                                : 'No price'}
                            </p>
                          </div>
                          {checked && line ? (
                            <div className="flex shrink-0 flex-col gap-1">
                              <label className="text-[11px] font-semibold text-ink-ghost">Bill by</label>
                              <select
                                value={line.saleUnit}
                                onChange={(e) =>
                                  setLine(item.itemCode, {
                                    saleUnit: e.target.value as SaleUnit,
                                    quantity: 1,
                                  })
                                }
                                className="rounded border border-border-sage px-1.5 py-1 text-xs"
                              >
                                {getSaleUnits(item).map((u) => (
                                  <option key={u} value={u}>
                                    {saleUnitLabel(u, item)}
                                  </option>
                                ))}
                              </select>
                              <label className="text-[11px] font-semibold text-ink-ghost">Qty</label>
                              <NumericInput
                                value={line.quantity}
                                onChange={(qty) => setLine(item.itemCode, { quantity: qty })}
                                min={allowsDecimalQty(saleUnit) ? 0.01 : 1}
                                max={maxQty}
                                allowDecimal={allowsDecimalQty(saleUnit)}
                                className="w-20 px-2 py-1"
                              />
                            </div>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {selectedLines.length > 0 ? (
            <div className="rounded-xl border border-border-sage bg-cream/30 p-4">
              <p className="text-xs font-semibold text-ink-ghost">Bill summary</p>
              <ul className="mt-2 space-y-1 text-sm">
                {selectedLines.map(({ item, quantity, saleUnit, unitPrice }) => (
                  <li key={item.itemCode} className="flex justify-between gap-2">
                    <span>
                      {item.name} × {quantity} {saleUnitLabel(saleUnit, item)}
                    </span>
                    <span className="font-semibold">{formatRupee(unitPrice * quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t border-border-sage pt-3 font-semibold">
                <span>Total</span>
                <span className="text-lg text-sage-deep">{formatRupee(total)}</span>
              </div>
            </div>
          ) : null}

          <label className="block">
            <span className={formLabelClass}>Payment method</span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as OfflinePaymentMethodType)}
              className={formSelectClass}
            >
              {OFFLINE_PAYMENT_METHOD_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void handleSubmit()} disabled={submitting || !selectedLines.length}>
              Create bill {total > 0 ? `· ${formatRupee(total)}` : ''}
            </Button>
            <Button type="button" variant="secondary" onClick={handleSaveDraft} disabled={submitting}>
              Save as draft
            </Button>
            {activeDraftId ? (
              <Button type="button" variant="secondary" onClick={handleSaveNewDraft} disabled={submitting}>
                Save as new draft
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineBillPage;
