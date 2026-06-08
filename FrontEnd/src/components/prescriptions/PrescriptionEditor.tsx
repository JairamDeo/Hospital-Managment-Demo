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
import {
  computeMedicineTotalQty,
  TIMING_LABELS,
  type MedicineTiming,
  type PrescriptionChuran,
  type PrescriptionMedicine,
  type StructuredPrescription,
} from '@/types/structuredPrescription.types';
import type { PharmacyItemApi } from '@/types/pharmacy.types';

const emptyTiming = (): MedicineTiming => ({});

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
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) => (
  <div className="inline-flex items-center rounded-lg border border-border-sage bg-white">
    <button
      type="button"
      onClick={() => onChange(Math.max(min, value - 1))}
      disabled={value <= min}
      className="cursor-pointer rounded-l-lg px-2 py-1 text-ink-soft hover:bg-sage-mist/50 disabled:opacity-40"
      aria-label="Decrease"
    >
      <Minus className="h-3.5 w-3.5" />
    </button>
    <NumericInput
      value={value}
      onChange={onChange}
      min={min}
      className="w-12 border-x border-border-sage border-y-0 rounded-none px-1 py-1 text-center text-sm shadow-none focus:ring-0"
    />
    <button
      type="button"
      onClick={() => onChange(value + 1)}
      className="cursor-pointer rounded-r-lg px-2 py-1 text-ink-soft hover:bg-sage-mist/50"
      aria-label="Increase"
    >
      <Plus className="h-3.5 w-3.5" />
    </button>
  </div>
);

export const PrescriptionEditor = ({
  patientCode,
  appointmentCode = '',
  compact = false,
  onSaved,
}: Props) => {
  const { showToast } = useToast();
  const [pharmacyItems, setPharmacyItems] = useState<PharmacyItemApi[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const debouncedSearch = useDebouncedValue(itemSearch, 300);
  const [medicines, setMedicines] = useState<PrescriptionMedicine[]>([]);
  const [churans, setChurans] = useState<PrescriptionChuran[]>([]);
  const [diagnosis, setDiagnosis] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saved, setSaved] = useState<StructuredPrescription | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

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
    () => searchPharmacyItems(pharmacyItems, debouncedSearch),
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
    setMedicines((prev) => [...prev, pharmacyMedicine(item)]);
    setItemSearch('');
  };

  const updateMedicine = (index: number, patch: Partial<PrescriptionMedicine>) => {
    setMedicines((prev) =>
      prev.map((m, i) => {
        if (i !== index) return m;
        const next = { ...m, ...patch };
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

  const handleSave = async () => {
    const validMeds = medicines.filter((m) => m.name.trim());
    const validChurans = churans.filter((c) => c.name.trim());
    if (!validMeds.length && !validChurans.length) {
      showToast('Add at least one medicine or churan', 'error');
      return;
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
            placeholder="Search medicines to add…"
            className={`${formInputClass} pl-9 pr-9`}
            autoComplete="off"
          />
          {isSearching ? (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-ghost" />
          ) : null}
        </div>

        {showSearchPrompt ? (
          <p className="rounded-lg border border-dashed border-border-sage bg-cream/30 px-3 py-4 text-center text-xs text-ink-soft">
            Type at least {PHARMACY_SEARCH_MIN_CHARS} characters to search pharmacy stock
          </p>
        ) : isSearching ? (
          <p className="py-4 text-center text-xs text-ink-soft">Searching…</p>
        ) : searchResults.length === 0 ? (
          <p className="py-4 text-center text-xs text-ink-soft">No medicines found</p>
        ) : (
          <ul className="max-h-40 divide-y divide-border-sage/60 overflow-y-auto rounded-lg border border-border-sage bg-white">
            {searchResults.map((item) => {
              const added = selectedCodes.has(item.itemCode);
              return (
                <li key={item.itemCode}>
                  <button
                    type="button"
                    disabled={added}
                    onClick={() => addMedicine(item)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
                      added ? 'cursor-default bg-sage-mist/40 opacity-60' : 'hover:bg-sage-mist/40'
                    }`}
                  >
                    <span className="min-w-0 truncate font-medium text-ink">{item.name}</span>
                    <span className="shrink-0 text-xs text-ink-ghost">
                      {item.unitSize || item.itemCode}
                      {added ? ' · added' : ''}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {!showSearchPrompt && searchResults.length >= PHARMACY_SEARCH_MAX_RESULTS ? (
          <p className="text-[10px] text-ink-ghost">Refine search to see more results</p>
        ) : null}
      </div>

      {medicines.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-ink-ghost">
            Selected ({medicines.length})
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {medicines.map((med, index) => (
              <div
                key={med.itemCode ?? index}
                className="rounded-lg border border-border-sage bg-cream/20 p-2.5"
              >
                <div className="mb-2 flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{med.name}</p>
                    <p className="text-[10px] text-ink-ghost">{med.itemCode}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMedicine(index)}
                    className="shrink-0 rounded p-0.5 text-ink-ghost hover:text-danger"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-ink-ghost">Pack</span>
                  <QtyStepper
                    value={med.packQuantity}
                    onChange={(v) => updateMedicine(index, { packQuantity: v })}
                  />
                  <span className="ml-auto text-[10px] text-ink-ghost">
                    Total: {computeMedicineTotalQty(med.packQuantity, med.timing)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-0.5">
                  {TIMING_LABELS.map(({ key: timingKey, label }) => (
                    <label key={timingKey} className="flex items-center gap-1 text-[10px]">
                      <input
                        type="checkbox"
                        checked={Boolean(med.timing[timingKey])}
                        onChange={() => toggleTiming(index, timingKey)}
                        className="accent-sage-deep"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={formLabelClass}>Diagnosis</span>
          <input
            type="text"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className={formInputClass}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className={formLabelClass}>Remarks</span>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            className={`${formInputClass} resize-none`}
          />
        </label>
      </div>

      <details className="rounded-lg border border-border-sage bg-white/60">
        <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-ink-soft">
          Churan (optional)
        </summary>
        <div className="space-y-2 border-t border-border-sage p-3">
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
            churans.map((ch, index) => (
              <div key={index} className="grid gap-2 rounded-lg border border-border-sage/60 p-2">
                <input
                  type="text"
                  value={ch.name}
                  onChange={(e) =>
                    setChurans((prev) =>
                      prev.map((c, i) => (i === index ? { ...c, name: e.target.value } : c))
                    )
                  }
                  placeholder="Churan name"
                  className={formInputClass}
                />
                <input
                  type="text"
                  value={ch.howToIntake}
                  onChange={(e) =>
                    setChurans((prev) =>
                      prev.map((c, i) => (i === index ? { ...c, howToIntake: e.target.value } : c))
                    )
                  }
                  placeholder="How to intake"
                  className={formInputClass}
                />
              </div>
            ))
          )}
        </div>
      </details>

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
