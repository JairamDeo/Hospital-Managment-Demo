import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Minus, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NumericInput } from '@/components/ui/NumericInput';
import { FormDraftPanel } from '@/components/ui/FormDraftPanel';
import { formInputClass, formLabelClass } from '@/components/ui/formStyles';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useToast } from '@/hooks/useToast';
import { patientAdminService } from '@/services/patient/patientAdmin.service';
import { pharmacyService } from '@/services/pharmacy/pharmacy.service';
import { FORM_DRAFT_CATEGORIES, draftContextKeys } from '@/store/formDraftStorage';
import { getApiErrorMessage } from '@/utils/helpers';
import {
  PHARMACY_SEARCH_MAX_RESULTS,
  PHARMACY_SEARCH_MIN_CHARS,
  searchPharmacyItems,
} from '@/utils/pharmacySearch.util';
import { getStockBaseUnits, getUnitsPerPack } from '@/utils/pharmacyStockUnits.util';
import {
  buildChuranCombination,
  computeMedicineTotalQty,
  TIMING_LABELS,
  type ChuranPowderComponent,
  type MedicineTiming,
  type PrescriptionChuran,
  type PrescriptionMedicine,
  type StructuredPrescription,
} from '@/types/structuredPrescription.types';
import type { PharmacyItemApi } from '@/types/pharmacy.types';

const emptyTiming = (): MedicineTiming => ({});

const getMaxPackStock = (item: PharmacyItemApi) => {
  const base = getStockBaseUnits(item);
  const upp = getUnitsPerPack(item);
  const packs = item.stockPacks ?? base / upp;
  return Math.max(0, Math.floor(packs));
};

const getMaxPowderGrams = (item: PharmacyItemApi) =>
  Math.max(0, Math.floor(getStockBaseUnits(item) * 100) / 100);

const formatStockLabel = (item: PharmacyItemApi) => {
  if (item.stockDisplay) return item.stockDisplay;
  const type = item.itemType ?? 'unit';
  if (type === 'weight') return `${getMaxPowderGrams(item)}g`;
  const packs = getMaxPackStock(item);
  return packs === 1 ? '1 pack' : `${packs} packs`;
};

const pharmacyMedicine = (item: PharmacyItemApi): PrescriptionMedicine => ({
  name: item.name,
  itemCode: item.itemCode,
  isManual: false,
  packQuantity: 1,
  timing: emptyTiming(),
  totalQuantity: 0,
});

const emptyChuran = (): PrescriptionChuran => ({
  name: '',
  combination: '',
  powders: [],
  howToIntake: '',
});

interface PrescriptionDraft {
  patientCode: string;
  appointmentCode: string;
  medicines: PrescriptionMedicine[];
  churans: PrescriptionChuran[];
  diagnosis: string;
  remarks: string;
  itemSearch: string;
}

interface Props {
  patientCode: string;
  appointmentCode?: string;
  compact?: boolean;
  onSaved?: (prescription: StructuredPrescription) => void;
}

const QtyStepper = ({
  value,
  onChange,
  min = 1,
  max,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) => {
  const atMax = max != null && value >= max;
  return (
    <div className="inline-flex items-center rounded-lg border border-border-sage bg-white">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        className="cursor-pointer rounded-l-lg px-2 py-1 text-ink-soft hover:bg-sage-mist/50 disabled:opacity-40"
        aria-label="Decrease"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <NumericInput
        value={value}
        onChange={(v) => {
          const next = max != null ? Math.min(max, v) : v;
          onChange(Math.max(min, next));
        }}
        min={min}
        max={max}
        className="w-12 border-x border-border-sage border-y-0 rounded-none px-1 py-1 text-center text-sm shadow-none focus:ring-0"
      />
      <button
        type="button"
        onClick={() => onChange(max != null ? Math.min(max, value + step) : value + step)}
        disabled={atMax}
        className="cursor-pointer rounded-r-lg px-2 py-1 text-ink-soft hover:bg-sage-mist/50 disabled:opacity-40"
        aria-label="Increase"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export const PrescriptionEditor = ({
  patientCode,
  appointmentCode = '',
  compact = false,
  onSaved,
}: Props) => {
  const { showToast } = useToast();
  const [pharmacyItems, setPharmacyItems] = useState<PharmacyItemApi[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [powderSearchByChuran, setPowderSearchByChuran] = useState<Record<number, string>>({});
  const debouncedSearch = useDebouncedValue(itemSearch, 300);
  const [medicines, setMedicines] = useState<PrescriptionMedicine[]>([]);
  const [churans, setChurans] = useState<PrescriptionChuran[]>([]);
  const [diagnosis, setDiagnosis] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saved, setSaved] = useState<StructuredPrescription | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const itemByCode = useMemo(
    () => new Map(pharmacyItems.map((item) => [item.itemCode, item])),
    [pharmacyItems]
  );

  const buildDraftLabel = useCallback((draft: PrescriptionDraft) => {
    const medCount = draft.medicines.length;
    const visit = draft.appointmentCode ? ` · ${draft.appointmentCode}` : '';
    return `${draft.patientCode}${visit} · ${medCount} medicine${medCount === 1 ? '' : 's'}`;
  }, []);

  const {
    drafts,
    hasDrafts,
    activeDraftId,
    saveDraft,
    saveNewDraft,
    restoreDraft,
    discardDraft,
    clearDraftAfterSubmit,
  } = useFormDraft<PrescriptionDraft>(FORM_DRAFT_CATEGORIES.prescription, {
    buildLabel: buildDraftLabel,
  });

  const draftPayload = (): PrescriptionDraft => ({
    patientCode,
    appointmentCode,
    medicines,
    churans,
    diagnosis,
    remarks,
    itemSearch,
  });

  const applyDraft = (draft: PrescriptionDraft) => {
    setMedicines(draft.medicines);
    setChurans(draft.churans.length ? draft.churans : []);
    setDiagnosis(draft.diagnosis);
    setRemarks(draft.remarks);
    setItemSearch(draft.itemSearch);
  };

  useEffect(() => {
    pharmacyService
      .getBillingItems()
      .then((res) => setPharmacyItems(res.data.res?.items ?? []))
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const searchResults = useMemo(
    () => searchPharmacyItems(pharmacyItems, debouncedSearch, PHARMACY_SEARCH_MAX_RESULTS, {
      itemType: 'non-weight',
    }),
    [pharmacyItems, debouncedSearch]
  );

  const isSearching =
    itemSearch.trim() !== debouncedSearch.trim() &&
    itemSearch.trim().length >= PHARMACY_SEARCH_MIN_CHARS;
  const showSearchPrompt = itemSearch.trim().length < PHARMACY_SEARCH_MIN_CHARS;

  const selectedCodes = useMemo(
    () => new Set(medicines.map((m) => m.itemCode).filter(Boolean)),
    [medicines]
  );

  const addMedicine = (item: PharmacyItemApi) => {
    if (selectedCodes.has(item.itemCode)) return;
    if (getMaxPackStock(item) < 1) {
      showToast(`${item.name} is out of stock`, 'error');
      return;
    }
    setMedicines((prev) => [...prev, pharmacyMedicine(item)]);
    setItemSearch('');
  };

  const updateMedicine = (index: number, patch: Partial<PrescriptionMedicine>) => {
    setMedicines((prev) =>
      prev.map((m, i) => {
        if (i !== index) return m;
        const next = { ...m, ...patch };
        const item = m.itemCode ? itemByCode.get(m.itemCode) : undefined;
        if (item && patch.packQuantity != null) {
          const max = getMaxPackStock(item);
          next.packQuantity = Math.min(Math.max(1, patch.packQuantity), max || 1);
        }
        next.totalQuantity = computeMedicineTotalQty(next.packQuantity, next.timing);
        return next;
      })
    );
  };

  const toggleTiming = (index: number, key: keyof MedicineTiming) => {
    setMedicines((prev) =>
      prev.map((m, i) => {
        if (i !== index) return m;
        const timing = { ...m.timing, [key]: !m.timing[key] };
        return {
          ...m,
          timing,
          totalQuantity: computeMedicineTotalQty(m.packQuantity, timing),
        };
      })
    );
  };

  const removeMedicine = (index: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const getPowderSearchResults = (churanIndex: number) => {
    const query = powderSearchByChuran[churanIndex] ?? '';
    return searchPharmacyItems(pharmacyItems, query, PHARMACY_SEARCH_MAX_RESULTS, {
      itemType: 'weight',
    });
  };

  const addPowderToChuran = (churanIndex: number, item: PharmacyItemApi) => {
    if (getMaxPowderGrams(item) < 1) {
      showToast(`${item.name} is out of stock`, 'error');
      return;
    }
    setChurans((prev) =>
      prev.map((ch, i) => {
        if (i !== churanIndex) return ch;
        if (ch.powders?.some((p) => p.itemCode === item.itemCode)) return ch;
        const powders: ChuranPowderComponent[] = [
          ...(ch.powders ?? []),
          { itemCode: item.itemCode, name: item.name, quantityGrams: 1 },
        ];
        return { ...ch, powders, combination: buildChuranCombination(powders) };
      })
    );
    setPowderSearchByChuran((prev) => ({ ...prev, [churanIndex]: '' }));
  };

  const updateChuranPowder = (
    churanIndex: number,
    powderIndex: number,
    quantityGrams: number
  ) => {
    setChurans((prev) =>
      prev.map((ch, i) => {
        if (i !== churanIndex) return ch;
        const powders = (ch.powders ?? []).map((p, pi) => {
          if (pi !== powderIndex) return p;
          const item = itemByCode.get(p.itemCode);
          const max = item ? getMaxPowderGrams(item) : quantityGrams;
          return { ...p, quantityGrams: Math.min(Math.max(1, quantityGrams), max || 1) };
        });
        return { ...ch, powders, combination: buildChuranCombination(powders) };
      })
    );
  };

  const removeChuranPowder = (churanIndex: number, powderIndex: number) => {
    setChurans((prev) =>
      prev.map((ch, i) => {
        if (i !== churanIndex) return ch;
        const powders = (ch.powders ?? []).filter((_, pi) => pi !== powderIndex);
        return { ...ch, powders, combination: buildChuranCombination(powders) };
      })
    );
  };

  const updateChuranField = (
    churanIndex: number,
    patch: Partial<Pick<PrescriptionChuran, 'name' | 'howToIntake'>>
  ) => {
    setChurans((prev) =>
      prev.map((ch, i) => (i === churanIndex ? { ...ch, ...patch } : ch))
    );
  };

  const handleSave = async () => {
    const validMeds = medicines.filter((m) => m.name.trim());
    const validChurans = churans
      .filter((c) => c.name.trim() && (c.powders?.length || c.combination.trim()))
      .map((c) => ({
        ...c,
        combination: c.combination?.trim() || buildChuranCombination(c.powders ?? []),
        powders: c.powders ?? [],
      }));

    if (!validMeds.length && !validChurans.length) {
      showToast('Add at least one medicine or churan', 'error');
      return;
    }

    for (const med of validMeds) {
      if (!med.itemCode) continue;
      const item = itemByCode.get(med.itemCode);
      if (!item) continue;
      const max = getMaxPackStock(item);
      if (med.packQuantity > max) {
        showToast(`${med.name}: only ${max} pack(s) in stock`, 'error');
        return;
      }
    }

    for (const ch of validChurans) {
      for (const p of ch.powders ?? []) {
        const item = itemByCode.get(p.itemCode);
        if (!item) continue;
        const max = getMaxPowderGrams(item);
        if (p.quantityGrams > max) {
          showToast(`${p.name}: only ${max}g in stock`, 'error');
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const { data } = await patientAdminService.createStructuredPrescription(patientCode, {
        appointmentCode: appointmentCode || undefined,
        diagnosis: diagnosis.trim(),
        remarks: remarks.trim(),
        medicines: validMeds.map((m) => ({
          ...m,
          totalQuantity: computeMedicineTotalQty(m.packQuantity, m.timing),
        })),
        churans: validChurans,
      });
      if (data.res?.prescription) {
        clearDraftAfterSubmit(
          draftContextKeys.prescription(patientCode, appointmentCode || undefined)
        );
        setSaved(data.res.prescription);
        onSaved?.(data.res.prescription);
        showToast('Prescription saved', 'success');
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="py-8 text-center text-sm text-ink-soft">Loading pharmacy…</p>;
  }

  return (
    <div className={compact ? 'space-y-4' : 'space-y-5'}>
      {hasDrafts ? (
        <FormDraftPanel
          drafts={drafts}
          activeDraftId={activeDraftId}
          onRestore={(id) => {
            const draft = restoreDraft(id);
            if (draft) {
              applyDraft(draft);
              showToast('Draft restored', 'success');
            }
          }}
          onDiscard={(id) => {
            discardDraft(id);
            showToast('Draft discarded', 'success');
          }}
        />
      ) : null}

      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-ghost" />
          <input
            type="search"
            value={itemSearch}
            onChange={(e) => setItemSearch(e.target.value)}
            placeholder={`Type at least ${PHARMACY_SEARCH_MIN_CHARS} characters to search pharmacy stock`}
            className={`${formInputClass} pl-9 pr-9`}
            autoComplete="off"
          />
          {isSearching ? (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-ghost" />
          ) : null}
        </div>

        {!showSearchPrompt && isSearching ? (
          <p className="py-2 text-center text-xs text-ink-soft">Searching…</p>
        ) : !showSearchPrompt && searchResults.length === 0 ? (
          <p className="py-2 text-center text-xs text-ink-soft">No medicines found</p>
        ) : !showSearchPrompt ? (
          <ul className="max-h-48 divide-y divide-border-sage/60 overflow-y-auto rounded-lg border border-border-sage bg-white">
            {searchResults.map((item) => {
              const added = selectedCodes.has(item.itemCode);
              const stock = getMaxPackStock(item);
              const outOfStock = stock < 1;
              return (
                <li key={item.itemCode}>
                  <button
                    type="button"
                    disabled={added || outOfStock}
                    onClick={() => addMedicine(item)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
                      added || outOfStock
                        ? 'cursor-default bg-sage-mist/40 opacity-60'
                        : 'hover:bg-sage-mist/40'
                    }`}
                  >
                    <span className="min-w-0 truncate font-medium text-ink">{item.name}</span>
                    <span className="shrink-0 text-xs text-ink-ghost">
                      Stock: {formatStockLabel(item)}
                      {added ? ' · added' : outOfStock ? ' · out of stock' : ''}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
        {!showSearchPrompt && searchResults.length >= PHARMACY_SEARCH_MAX_RESULTS ? (
          <p className="text-[10px] text-ink-ghost">Refine search to see more results</p>
        ) : null}
      </div>

      {medicines.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-ink-ghost">Selected ({medicines.length})</p>
          <div className="space-y-2">
            {medicines.map((med, index) => {
              const item = med.itemCode ? itemByCode.get(med.itemCode) : undefined;
              const maxPacks = item ? getMaxPackStock(item) : undefined;
              return (
                <div
                  key={med.itemCode ?? index}
                  className="rounded-lg border border-border-sage bg-cream/20 p-3"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{med.name}</p>
                      <p className="text-xs text-ink-ghost">
                        {item ? `Stock: ${formatStockLabel(item)}` : med.itemCode}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-ink-ghost">Pack</span>
                      <QtyStepper
                        value={med.packQuantity}
                        onChange={(v) => updateMedicine(index, { packQuantity: v })}
                        max={maxPacks}
                      />
                      <span className="text-xs text-ink-ghost">
                        Total: {computeMedicineTotalQty(med.packQuantity, med.timing)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMedicine(index)}
                        className="shrink-0 rounded p-0.5 text-ink-ghost hover:text-danger"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    {TIMING_LABELS.map(({ key: timingKey, label }) => (
                      <label
                        key={timingKey}
                        className="flex shrink-0 items-center gap-1.5 text-sm text-ink"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(med.timing[timingKey])}
                          onChange={() => toggleTiming(index, timingKey)}
                          className="h-4 w-4 accent-sage-deep"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <details className="rounded-lg border border-border-sage bg-white/60" open>
        <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-ink-soft">
          Churan (optional)
        </summary>
        <div className="space-y-3 border-t border-border-sage p-3">
          {churans.length === 0 ? (
            <Button
              type="button"
              variant="secondary"
              className="gap-1 text-xs"
              onClick={() => setChurans([emptyChuran()])}
            >
              <Plus className="h-3.5 w-3.5" />
              Add churan
            </Button>
          ) : (
            churans.map((ch, churanIndex) => {
              const powderQuery = powderSearchByChuran[churanIndex] ?? '';
              const powderResults = getPowderSearchResults(churanIndex);
              const showPowderPrompt = powderQuery.trim().length < PHARMACY_SEARCH_MIN_CHARS;
              const selectedPowderCodes = new Set((ch.powders ?? []).map((p) => p.itemCode));

              return (
                <div
                  key={churanIndex}
                  className="space-y-2 rounded-lg border border-border-sage/60 bg-cream/20 p-3"
                >
                  <div className="flex flex-wrap items-start gap-2">
                    <input
                      type="text"
                      value={ch.name}
                      onChange={(e) => updateChuranField(churanIndex, { name: e.target.value })}
                      placeholder="Churan name"
                      className={`${formInputClass} min-w-[140px] flex-1`}
                    />
                    <div className="relative min-w-[200px] flex-[2]">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-ghost" />
                      <input
                        type="search"
                        value={powderQuery}
                        onChange={(e) =>
                          setPowderSearchByChuran((prev) => ({
                            ...prev,
                            [churanIndex]: e.target.value,
                          }))
                        }
                        placeholder={`Type at least ${PHARMACY_SEARCH_MIN_CHARS} characters to search powder`}
                        className={`${formInputClass} py-2 pl-8 text-sm`}
                        autoComplete="off"
                      />
                    </div>
                    <input
                      type="text"
                      value={ch.howToIntake}
                      onChange={(e) =>
                        updateChuranField(churanIndex, { howToIntake: e.target.value })
                      }
                      placeholder="How to intake"
                      className={`${formInputClass} min-w-[180px] flex-[2]`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setChurans((prev) => prev.filter((_, i) => i !== churanIndex))
                      }
                      className="shrink-0 rounded p-1 text-ink-ghost hover:text-danger"
                      aria-label="Remove churan"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {!showPowderPrompt && powderResults.length === 0 && powderQuery.trim() ? (
                    <p className="text-xs text-ink-ghost">No powders found</p>
                  ) : !showPowderPrompt && powderResults.length > 0 ? (
                    <ul className="max-h-32 divide-y divide-border-sage/60 overflow-y-auto rounded-lg border border-border-sage bg-white">
                      {powderResults.map((item) => {
                        const added = selectedPowderCodes.has(item.itemCode);
                        const outOfStock = getMaxPowderGrams(item) < 1;
                        return (
                          <li key={item.itemCode}>
                            <button
                              type="button"
                              disabled={added || outOfStock}
                              onClick={() => addPowderToChuran(churanIndex, item)}
                              className={`flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-xs ${
                                added || outOfStock
                                  ? 'cursor-default opacity-60'
                                  : 'hover:bg-sage-mist/40'
                              }`}
                            >
                              <span className="truncate font-medium">{item.name}</span>
                              <span className="shrink-0 text-ink-ghost">
                                {formatStockLabel(item)}
                                {added ? ' · added' : ''}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}

                  {(ch.powders ?? []).length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-ink-ghost">Powder mix (grams)</p>
                      {(ch.powders ?? []).map((powder, powderIndex) => {
                        const item = itemByCode.get(powder.itemCode);
                        const maxGrams = item ? getMaxPowderGrams(item) : undefined;
                        return (
                          <div
                            key={powder.itemCode}
                            className="flex flex-wrap items-center gap-2 rounded-lg border border-border-sage/50 bg-white px-2 py-1.5"
                          >
                            <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">
                              {powder.name}
                            </span>
                            <QtyStepper
                              value={powder.quantityGrams}
                              onChange={(v) => updateChuranPowder(churanIndex, powderIndex, v)}
                              min={1}
                              max={maxGrams}
                            />
                            <span className="text-[10px] text-ink-ghost">g</span>
                            {item ? (
                              <span className="text-[10px] text-ink-ghost">
                                / {maxGrams}g stock
                              </span>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => removeChuranPowder(churanIndex, powderIndex)}
                              className="rounded p-0.5 text-ink-ghost hover:text-danger"
                              aria-label="Remove powder"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                      {ch.combination ? (
                        <p className="text-[10px] text-ink-soft">Mix: {ch.combination}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
          {churans.length > 0 ? (
            <Button
              type="button"
              variant="secondary"
              className="gap-1 text-xs"
              onClick={() => setChurans((prev) => [...prev, emptyChuran()])}
            >
              <Plus className="h-3.5 w-3.5" />
              Add another churan
            </Button>
          ) : null}
        </div>
      </details>

      <div className="grid gap-3">
        <label className="block">
          <span className={formLabelClass}>Diagnosis</span>
          <input
            type="text"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className={formInputClass}
          />
        </label>
        <label className="block">
          <span className={formLabelClass}>Remarks</span>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            className={`${formInputClass} resize-none`}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void handleSave()} disabled={submitting || Boolean(saved)}>
          {saved ? 'Prescription saved' : 'Save prescription'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            saveDraft(draftPayload(), {
              contextKey: draftContextKeys.prescription(patientCode, appointmentCode || undefined),
            });
            showToast('Draft saved', 'success');
          }}
          disabled={submitting}
        >
          Save draft
        </Button>
        {activeDraftId ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              saveNewDraft(draftPayload(), {
                contextKey: draftContextKeys.prescription(patientCode, appointmentCode || undefined),
              });
              showToast('New draft saved', 'success');
            }}
            disabled={submitting}
          >
            Save as new draft
          </Button>
        ) : null}
      </div>
    </div>
  );
};
