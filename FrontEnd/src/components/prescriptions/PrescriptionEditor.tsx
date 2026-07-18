import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlaskConical, Loader2, Minus, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NumericInput } from '@/components/ui/NumericInput';
import { FormDraftPanel } from '@/components/ui/FormDraftPanel';
import { formInputClass, formLabelClass } from '@/components/ui/formStyles';
import { RecommendLabTestsModal } from '@/components/prescriptions/RecommendLabTestsModal';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useToast } from '@/hooks/useToast';
import { patientAdminService } from '@/services/patient/patientAdmin.service';
import { pharmacyService } from '@/services/pharmacy/pharmacy.service';
import { masterService } from '@/services/master/master.service';
import { FORM_DRAFT_CATEGORIES, draftContextKeys } from '@/store/formDraftStorage';
import { getApiErrorMessage } from '@/utils/helpers';
import {
  PHARMACY_SEARCH_MAX_RESULTS,
  PHARMACY_SEARCH_MIN_CHARS,
  searchPharmacyItems,
} from '@/utils/pharmacySearch.util';
import { getStockBaseUnits, getUnitsPerPack, saleUnitLabel } from '@/utils/pharmacyStockUnits.util';
import {
  buildChuranCombination,
  computeMedicineTotalQty,
  maxSpoonsForPowderStock,
  powderGramsFromSpoons,
  TIMING_LABELS,
  type ChuranPowderComponent,
  type MedicineTiming,
  type PrescriptionChuran,
  type PrescriptionMedicine,
  type RecommendedLabTest,
  type StructuredPrescription,
} from '@/types/structuredPrescription.types';
import type { PharmacySpoonItem } from '@/types/api.types';
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
  const unit = saleUnitLabel('pack', item);
  return packs === 1 ? `1 ${unit}` : `${packs} ${unit}s`;
};

const spoonNameForGrams = (grams: number, options: PharmacySpoonItem[]) => {
  const match = options.find((s) => s.grams === grams);
  return match?.name?.trim() || 'spoon';
};

const formatPowderPackStock = (item: PharmacyItemApi) => {
  const packs = getMaxPackStock(item);
  const unit = saleUnitLabel('pack', item);
  return packs === 1 ? `1 ${unit}` : `${packs} ${unit}s`;
};

const formatPowderSpoonUsage = (
  usedSpoons: number,
  maxSpoons: number,
  item: PharmacyItemApi,
  atLimit: boolean
) => {
  const remaining = Math.max(0, maxSpoons - usedSpoons);
  const packStock = formatPowderPackStock(item);
  const spoonUsed = `${usedSpoons} spoon${usedSpoons === 1 ? '' : 's'} used`;
  const spoonLeft = `${remaining.toLocaleString('en-IN')} spoon${remaining === 1 ? '' : 's'} left`;

  if (atLimit) return `${spoonUsed} · max reached · ${packStock} in stock`;
  return `${spoonUsed} · ${spoonLeft} · ${packStock} in stock`;
};

const compactSpoonSelectClass =
  'w-auto max-w-[9rem] shrink-0 rounded-lg border border-border-sage bg-white px-2 py-1 pr-7 text-xs text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage-pale';

const getPowderGramsUsed = (
  churans: PrescriptionChuran[],
  itemCode: string,
  except?: { churanIndex: number; powderIndex: number }
) => {
  let total = 0;
  churans.forEach((ch, churanIndex) => {
    (ch.powders ?? []).forEach((p, powderIndex) => {
      if (p.itemCode !== itemCode) return;
      if (except?.churanIndex === churanIndex && except.powderIndex === powderIndex) return;
      total +=
        p.quantityGrams > 0
          ? p.quantityGrams
          : powderGramsFromSpoons(p.quantitySpoons ?? 0, p.spoonGrams ?? 1);
    });
  });
  return total;
};

const getMaxSpoonsForPowderLine = (
  item: PharmacyItemApi,
  spoonGrams: number,
  churans: PrescriptionChuran[],
  churanIndex: number,
  powderIndex: number
) => {
  const stockGrams = getStockBaseUnits(item);
  const used = getPowderGramsUsed(churans, item.itemCode, { churanIndex, powderIndex });
  const availableGrams = Math.max(0, stockGrams - used);
  return maxSpoonsForPowderStock(availableGrams, spoonGrams);
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
  intakeNote: '',
  howToIntake: '',
});

const makePowderComponent = (
  item: PharmacyItemApi,
  spoonGrams: number
): ChuranPowderComponent => ({
  itemCode: item.itemCode,
  name: item.name,
  quantitySpoons: 1,
  spoonGrams,
  quantityGrams: powderGramsFromSpoons(1, spoonGrams),
});

interface PrescriptionDraft {
  patientCode: string;
  appointmentCode: string;
  medicines: PrescriptionMedicine[];
  churans: PrescriptionChuran[];
  recommendedTests: RecommendedLabTest[];
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

const fieldLabelClass = 'mb-1 block text-xs font-semibold text-ink-ghost';

const QtyStepper = ({
  value,
  onChange,
  min = 1,
  max,
  step = 1,
  compact = false,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  compact?: boolean;
}) => {
  const atMax = max != null && value >= max;
  const btnClass = compact
    ? 'cursor-pointer px-1 py-0.5 text-ink-soft hover:bg-sage-mist/50 disabled:opacity-40'
    : 'cursor-pointer rounded-l-lg px-2 py-1 text-ink-soft hover:bg-sage-mist/50 disabled:opacity-40';
  const btnClassRight = compact
    ? 'cursor-pointer px-1 py-0.5 text-ink-soft hover:bg-sage-mist/50 disabled:opacity-40'
    : 'cursor-pointer rounded-r-lg px-2 py-1 text-ink-soft hover:bg-sage-mist/50 disabled:opacity-40';
  const inputClass = compact
    ? 'w-8 border-x border-border-sage border-y-0 rounded-none px-0.5 py-0.5 text-center text-xs shadow-none focus:ring-0'
    : 'w-12 border-x border-border-sage border-y-0 rounded-none px-1 py-1 text-center text-sm shadow-none focus:ring-0';
  const iconClass = compact ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return (
    <div
      className={`inline-flex items-center border border-border-sage bg-white ${compact ? 'rounded-md' : 'rounded-lg'}`}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        className={compact ? `${btnClass} rounded-l-md` : btnClass}
        aria-label="Decrease"
      >
        <Minus className={iconClass} />
      </button>
      <NumericInput
        value={value}
        onChange={(v) => {
          const next = max != null ? Math.min(max, v) : v;
          onChange(Math.max(min, next));
        }}
        min={min}
        max={max}
        className={inputClass}
      />
      <button
        type="button"
        onClick={() => onChange(max != null ? Math.min(max, value + step) : value + step)}
        disabled={atMax}
        className={compact ? `${btnClassRight} rounded-r-md` : btnClassRight}
        aria-label="Increase"
      >
        <Plus className={iconClass} />
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
  const [spoonSizes, setSpoonSizes] = useState<PharmacySpoonItem[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [powderSearchByChuran, setPowderSearchByChuran] = useState<Record<number, string>>({});
  const debouncedSearch = useDebouncedValue(itemSearch, 300);
  const [medicines, setMedicines] = useState<PrescriptionMedicine[]>([]);
  const [churans, setChurans] = useState<PrescriptionChuran[]>(() => [emptyChuran()]);
  const [recommendedTests, setRecommendedTests] = useState<RecommendedLabTest[]>([]);
  const [labModalOpen, setLabModalOpen] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saved, setSaved] = useState<StructuredPrescription | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const itemByCode = useMemo(
    () => new Map(pharmacyItems.map((item) => [item.itemCode, item])),
    [pharmacyItems]
  );

  const defaultSpoonGrams = useMemo(() => {
    const preferred = spoonSizes.find((s) => s.isDefault) ?? spoonSizes[0];
    return preferred?.grams ?? 1.5;
  }, [spoonSizes]);

  const spoonOptions = useMemo(
    () =>
      spoonSizes.length
        ? spoonSizes
        : [{ _id: 'default', code: 'SPOON-DEFAULT', name: 'spoon', grams: defaultSpoonGrams }],
    [spoonSizes, defaultSpoonGrams]
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
    recommendedTests,
    diagnosis,
    remarks,
    itemSearch,
  });

  const applyDraft = (draft: PrescriptionDraft) => {
    setMedicines(draft.medicines);
    setChurans(draft.churans.length ? draft.churans : [emptyChuran()]);
    setRecommendedTests(draft.recommendedTests ?? []);
    setDiagnosis(draft.diagnosis);
    setRemarks(draft.remarks);
    setItemSearch(draft.itemSearch);
  };

  useEffect(() => {
    if (loading) return;
    setChurans((prev) => {
      if (prev.length > 0) return prev;
      return [emptyChuran()];
    });
  }, [loading]);

  useEffect(() => {
    Promise.all([
      pharmacyService.getBillingItems(),
      masterService.listPharmacySpoons(true),
    ])
      .then(([pharmacyRes, spoonRes]) => {
        setPharmacyItems(pharmacyRes.data.res?.items ?? []);
        setSpoonSizes(spoonRes.data.res?.items ?? []);
      })
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
    const spoonGrams = item.spoonSizeGrams ?? defaultSpoonGrams;
    setChurans((prev) => {
      const usedGrams = getPowderGramsUsed(prev, item.itemCode);
      const availableGrams = Math.max(0, getStockBaseUnits(item) - usedGrams);
      const maxSpoons = maxSpoonsForPowderStock(availableGrams, spoonGrams);
      if (maxSpoons < 1) {
        showToast(`${item.name} is out of stock`, 'error');
        return prev;
      }
      return prev.map((ch, i) => {
        if (i !== churanIndex) return ch;
        if (ch.powders?.some((p) => p.itemCode === item.itemCode)) return ch;
        const powders: ChuranPowderComponent[] = [
          ...(ch.powders ?? []),
          makePowderComponent(item, spoonGrams),
        ];
        return { ...ch, powders, combination: buildChuranCombination(powders) };
      });
    });
    setPowderSearchByChuran((prev) => ({ ...prev, [churanIndex]: '' }));
  };

  const updateChuranPowder = (
    churanIndex: number,
    powderIndex: number,
    patch: { quantitySpoons?: number; spoonGrams?: number }
  ) => {
    setChurans((prev) =>
      prev.map((ch, i) => {
        if (i !== churanIndex) return ch;
        const powders = (ch.powders ?? []).map((p, pi) => {
          if (pi !== powderIndex) return p;
          const spoonGrams = patch.spoonGrams ?? p.spoonGrams ?? defaultSpoonGrams;
          let quantitySpoons = patch.quantitySpoons ?? p.quantitySpoons ?? 1;
          const item = itemByCode.get(p.itemCode);
          const maxSpoons = item
            ? getMaxSpoonsForPowderLine(item, spoonGrams, prev, churanIndex, powderIndex)
            : quantitySpoons;
          if (maxSpoons < 1) quantitySpoons = 1;
          else quantitySpoons = Math.min(Math.max(1, quantitySpoons), maxSpoons);
          return {
            ...p,
            spoonGrams,
            quantitySpoons,
            quantityGrams: powderGramsFromSpoons(quantitySpoons, spoonGrams),
          };
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
    patch: Partial<Pick<PrescriptionChuran, 'name' | 'intakeNote'>>
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
        howToIntake: c.intakeNote?.trim() || c.howToIntake?.trim() || '',
        powders: c.powders ?? [],
      }));

    if (!validMeds.length && !validChurans.length && !recommendedTests.length) {
      showToast('Add at least one medicine, churan, or lab test', 'error');
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

    const powderUsage = new Map<string, number>();
    for (const ch of validChurans) {
      for (const p of ch.powders ?? []) {
        if (!p.itemCode) continue;
        powderUsage.set(p.itemCode, (powderUsage.get(p.itemCode) ?? 0) + p.quantityGrams);
      }
    }
    for (const [itemCode, gramsNeeded] of powderUsage) {
      const item = itemByCode.get(itemCode);
      if (!item) continue;
      const stockGrams = getStockBaseUnits(item);
      if (gramsNeeded > stockGrams) {
        showToast(
          `${item.name}: need ${gramsNeeded}g but only ${stockGrams}g available`,
          'error'
        );
        return;
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
        recommendedTests: recommendedTests.length ? recommendedTests : undefined,
      });
      if (data.res?.prescription) {
        clearDraftAfterSubmit(
          draftContextKeys.prescription(patientCode, appointmentCode || undefined)
        );
        setSaved(data.res.prescription);
        onSaved?.(data.res.prescription);
        showToast(
          recommendedTests.length
            ? 'Prescription saved — Lab notified for recommended tests'
            : 'Prescription saved',
          'success'
        );
        pharmacyService
          .getBillingItems()
          .then((res) => setPharmacyItems(res.data.res?.items ?? []))
          .catch(() => undefined);
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
        <label className="block">
          <span className={formLabelClass}>Choose medicine</span>
          <div className="relative mt-1">
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
        </label>

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
              const remaining =
                maxPacks != null ? Math.max(0, maxPacks - med.packQuantity) : null;
              const atLimit = maxPacks != null && med.packQuantity >= maxPacks;
              return (
                <div
                  key={med.itemCode ?? index}
                  className="rounded-lg border border-border-sage bg-cream/20 p-2.5"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    <p className="min-w-[100px] shrink-0 truncate text-sm font-semibold text-ink">
                      {med.name}
                    </p>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="text-[10px] font-semibold uppercase text-ink-ghost">
                        Pack
                      </span>
                      <QtyStepper
                        value={med.packQuantity}
                        onChange={(v) => updateMedicine(index, { packQuantity: v })}
                        max={maxPacks}
                        compact
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1">
                      {TIMING_LABELS.map(({ key: timingKey, label, title }) => (
                        <label
                          key={timingKey}
                          title={title}
                          className="flex shrink-0 cursor-pointer items-center gap-0.5 text-xs font-bold text-ink"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(med.timing[timingKey])}
                            onChange={() => toggleTiming(index, timingKey)}
                            className="h-3.5 w-3.5 accent-sage-deep"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMedicine(index)}
                      className="ml-auto shrink-0 rounded p-0.5 text-ink-ghost hover:text-danger"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]">
                    {item ? (
                      <span className="text-ink-ghost">In stock: {formatStockLabel(item)}</span>
                    ) : null}
                    {item && maxPacks != null ? (
                      <span
                        className={`font-semibold ${atLimit ? 'text-danger' : 'text-sage-deep'}`}
                      >
                        Using {med.packQuantity} of {maxPacks} · Available: {remaining}
                      </span>
                    ) : null}
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
          {churans.map((ch, churanIndex) => {
              const powderQuery = powderSearchByChuran[churanIndex] ?? '';
              const powderResults = getPowderSearchResults(churanIndex);
              const showPowderPrompt = powderQuery.trim().length < PHARMACY_SEARCH_MIN_CHARS;
              const selectedPowderCodes = new Set((ch.powders ?? []).map((p) => p.itemCode));

              return (
                <div
                  key={churanIndex}
                  className="space-y-2 rounded-lg border border-border-sage/60 bg-cream/20 p-3"
                >
                  <div className="grid gap-2 lg:grid-cols-[minmax(110px,1fr)_minmax(180px,1.6fr)_minmax(140px,1fr)_auto] lg:items-end">
                    <label className="block min-w-0">
                      <span className={fieldLabelClass}>Churan name</span>
                      <input
                        type="text"
                        value={ch.name}
                        onChange={(e) => updateChuranField(churanIndex, { name: e.target.value })}
                        placeholder="Name"
                        className={`${formInputClass} py-1.5 text-sm`}
                      />
                    </label>
                    <label className="block min-w-0">
                      <span className={fieldLabelClass}>Choose powder</span>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-ghost" />
                        <input
                          type="search"
                          value={powderQuery}
                          onChange={(e) =>
                            setPowderSearchByChuran((prev) => ({
                              ...prev,
                              [churanIndex]: e.target.value,
                            }))
                          }
                          placeholder={`Type ${PHARMACY_SEARCH_MIN_CHARS}+ chars`}
                          className={`${formInputClass} py-1.5 pl-8 text-sm`}
                          autoComplete="off"
                        />
                      </div>
                    </label>
                    <label className="block min-w-0">
                      <span className={fieldLabelClass}>How to intake</span>
                      <input
                        type="text"
                        value={ch.intakeNote ?? ''}
                        onChange={(e) =>
                          updateChuranField(churanIndex, { intakeNote: e.target.value })
                        }
                        placeholder="e.g. after meals"
                        className={`${formInputClass} py-1.5 text-sm`}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setChurans((prev) =>
                          prev.length <= 1
                            ? [emptyChuran()]
                            : prev.filter((_, i) => i !== churanIndex)
                        )
                      }
                      className="shrink-0 self-end rounded p-1 text-ink-ghost hover:text-danger lg:mb-0.5"
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
                        const spoonGrams = item.spoonSizeGrams ?? defaultSpoonGrams;
                        const usedGrams = getPowderGramsUsed(churans, item.itemCode);
                        const availGrams = Math.max(0, getStockBaseUnits(item) - usedGrams);
                        const availSpoons = maxSpoonsForPowderStock(availGrams, spoonGrams);
                        const outOfStock = availSpoons < 1;
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
                                {outOfStock
                                  ? 'Out of stock'
                                  : `${availSpoons.toLocaleString('en-IN')} spoons available · ${formatPowderPackStock(item)}`}
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
                      <p className="text-xs font-semibold text-ink-ghost">Powder mix (spoons)</p>
                      {(ch.powders ?? []).map((powder, powderIndex) => {
                        const item = itemByCode.get(powder.itemCode);
                        const spoonGrams = powder.spoonGrams || defaultSpoonGrams;
                        const maxSpoons = item
                          ? getMaxSpoonsForPowderLine(
                              item,
                              spoonGrams,
                              churans,
                              churanIndex,
                              powderIndex
                            )
                          : powder.quantitySpoons;
                        const atLimit = powder.quantitySpoons >= maxSpoons;
                        return (
                          <div
                            key={`${powder.itemCode}-${powderIndex}`}
                            className="rounded-lg border border-border-sage/50 bg-white px-2 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                                {powder.name}
                              </span>
                              <div className="flex shrink-0 items-center gap-1.5">
                                <QtyStepper
                                  value={powder.quantitySpoons}
                                  onChange={(v) =>
                                    updateChuranPowder(churanIndex, powderIndex, {
                                      quantitySpoons: v,
                                    })
                                  }
                                  min={1}
                                  max={maxSpoons}
                                  compact
                                />
                                <select
                                  value={spoonGrams}
                                  onChange={(e) =>
                                    updateChuranPowder(churanIndex, powderIndex, {
                                      spoonGrams: Number(e.target.value),
                                    })
                                  }
                                  className={compactSpoonSelectClass}
                                  title={spoonNameForGrams(spoonGrams, spoonOptions)}
                                >
                                  {spoonOptions.map((s) => (
                                    <option key={s._id} value={s.grams}>
                                      {s.name}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => removeChuranPowder(churanIndex, powderIndex)}
                                  className="rounded p-0.5 text-ink-ghost hover:text-danger"
                                  aria-label="Remove powder"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            {item ? (
                              <p
                                className={`mt-1.5 text-[11px] leading-relaxed ${atLimit ? 'font-medium text-danger' : 'text-ink-ghost'}`}
                              >
                                {formatPowderSpoonUsage(
                                  powder.quantitySpoons,
                                  maxSpoons,
                                  item,
                                  atLimit
                                )}
                              </p>
                            ) : null}
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
            })}
          <Button
            type="button"
            variant="secondary"
            className="gap-1 text-xs"
            onClick={() => setChurans((prev) => [...prev, emptyChuran()])}
          >
            <Plus className="h-3.5 w-3.5" />
            Add another churan
          </Button>

          <div className="mt-4 rounded-xl border border-border-sage bg-cream/40 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-ink">Recommended lab / PF tests</p>
                <p className="text-[11px] text-ink-soft">
                  {recommendedTests.length
                    ? `${recommendedTests.length} test(s) selected`
                    : 'Optional — notify Lab when prescription is saved'}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="gap-1 text-xs"
                onClick={() => setLabModalOpen(true)}
                disabled={Boolean(saved)}
              >
                <FlaskConical className="h-3.5 w-3.5" />
                {recommendedTests.length ? 'Edit tests' : 'PF / Lab report'}
              </Button>
            </div>
            {recommendedTests.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {recommendedTests.map((t) => (
                  <li
                    key={t.testCode}
                    className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-ink ring-1 ring-border-sage"
                  >
                    {t.testName}
                    {t.categoryName ? (
                      <span className="text-ink-ghost"> · {t.categoryName}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </details>

      <RecommendLabTestsModal
        open={labModalOpen}
        onClose={() => setLabModalOpen(false)}
        selected={recommendedTests}
        onSave={setRecommendedTests}
      />

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
