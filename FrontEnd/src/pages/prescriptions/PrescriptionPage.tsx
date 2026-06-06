import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  Minus,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NumericInput } from '@/components/ui/NumericInput';
import { StaffPagination } from '@/components/staff/StaffPagination';
import { formInputClass, formLabelClass } from '@/components/ui/formStyles';
import { patientAdminService } from '@/services/patient/patientAdmin.service';
import { pharmacyService } from '@/services/pharmacy/pharmacy.service';
import { useToast } from '@/hooks/useToast';
import { useFormDraft } from '@/hooks/useFormDraft';
import { FormDraftPanel } from '@/components/ui/FormDraftPanel';
import { FORM_DRAFT_CATEGORIES, draftContextKeys } from '@/store/formDraftStorage';
import { getApiErrorMessage } from '@/utils/helpers';
import { ROUTES, patientDetailPath } from '@/constants/routes';
import { usePermissions } from '@/hooks/usePermissions';
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

const emptyManualMedicine = (): PrescriptionMedicine => ({
  name: '',
  itemCode: '',
  isManual: true,
  packQuantity: 1,
  timing: emptyTiming(),
  totalQuantity: 0,
});

const emptyChuran = (): PrescriptionChuran => ({
  name: '',
  combination: '',
  howToIntake: '',
});

const CATALOG_PAGE_SIZE = 15;

interface PrescriptionDraft {
  patientCode: string;
  appointmentCode: string;
  medicines: PrescriptionMedicine[];
  churans: PrescriptionChuran[];
  diagnosis: string;
  remarks: string;
  expandedMedicineKeys: string[];
  itemSearch: string;
}

const medicineKey = (med: PrescriptionMedicine, index: number) =>
  med.isManual ? `manual-${index}` : (med.itemCode ?? `idx-${index}`);

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
      className="cursor-pointer rounded-l-lg px-2.5 py-1.5 text-ink-soft hover:bg-sage-mist/50 disabled:cursor-not-allowed disabled:opacity-40"
      aria-label="Decrease quantity"
    >
      <Minus className="h-4 w-4" />
    </button>
    <NumericInput
      value={value}
      onChange={onChange}
      min={min}
      className="w-14 border-x border-border-sage border-y-0 rounded-none px-1 py-1.5 text-center shadow-none focus:ring-0"
      aria-label="Quantity"
    />
    <button
      type="button"
      onClick={() => onChange(value + 1)}
      className="cursor-pointer rounded-r-lg px-2.5 py-1.5 text-ink-soft hover:bg-sage-mist/50"
      aria-label="Increase quantity"
    >
      <Plus className="h-4 w-4" />
    </button>
  </div>
);

export const PrescriptionPage = () => {
  const [searchParams] = useSearchParams();
  const patientCode = searchParams.get('patientCode') ?? '';
  const appointmentCode = searchParams.get('appointmentCode') ?? '';
  const { showToast } = useToast();
  const { canCreatePrescription } = usePermissions();

  const [pharmacyItems, setPharmacyItems] = useState<PharmacyItemApi[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogExpanded, setCatalogExpanded] = useState(true);
  const [selectedPanelExpanded, setSelectedPanelExpanded] = useState(true);
  const [expandedMedicineKeys, setExpandedMedicineKeys] = useState<Set<string>>(() => new Set());
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
    expandedMedicineKeys: [...expandedMedicineKeys],
    itemSearch,
  });

  const applyDraft = (draft: PrescriptionDraft) => {
    setMedicines(draft.medicines);
    setChurans(draft.churans.length ? draft.churans : [emptyChuran()]);
    setDiagnosis(draft.diagnosis);
    setRemarks(draft.remarks);
    setExpandedMedicineKeys(new Set(draft.expandedMedicineKeys));
    setItemSearch(draft.itemSearch);
  };

  const handleSaveDraft = () => {
    saveDraft(draftPayload(), {
      contextKey: draftContextKeys.prescription(patientCode, appointmentCode || undefined),
    });
    showToast('Prescription draft saved', 'success');
  };

  const handleSaveNewDraft = () => {
    saveNewDraft(draftPayload(), {
      contextKey: draftContextKeys.prescription(patientCode, appointmentCode || undefined),
    });
    showToast('New draft saved', 'success');
  };

  const handleRestoreDraft = (id: string) => {
    const draft = restoreDraft(id);
    if (!draft) return;
    applyDraft(draft);
    showToast('Draft restored — continue editing', 'success');
  };

  useEffect(() => {
    pharmacyService
      .getBillingItems()
      .then((res) => setPharmacyItems(res.data.res?.items ?? []))
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const filteredItems = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    const list = q
      ? pharmacyItems.filter((item) =>
          [item.name, item.itemCode, item.company, item.unitSize].some((f) =>
            f?.toLowerCase().includes(q)
          )
        )
      : pharmacyItems;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [pharmacyItems, itemSearch]);

  const selectedCodes = useMemo(
    () => new Set(medicines.filter((m) => m.itemCode && !m.isManual).map((m) => m.itemCode!)),
    [medicines]
  );

  const catalogTotalPages = Math.max(1, Math.ceil(filteredItems.length / CATALOG_PAGE_SIZE));

  const paginatedItems = useMemo(() => {
    const start = (catalogPage - 1) * CATALOG_PAGE_SIZE;
    return filteredItems.slice(start, start + CATALOG_PAGE_SIZE);
  }, [filteredItems, catalogPage]);

  useEffect(() => {
    setCatalogPage(1);
  }, [itemSearch]);

  useEffect(() => {
    if (catalogPage > catalogTotalPages) {
      setCatalogPage(catalogTotalPages);
    }
  }, [catalogPage, catalogTotalPages]);

  const toggleMedicineExpanded = (key: string) => {
    setExpandedMedicineKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (!patientCode) {
    return <Navigate to={ROUTES.ADMIN_PATIENTS} replace />;
  }

  if (!canCreatePrescription) {
    return <Navigate to={patientDetailPath(patientCode)} replace />;
  }

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

  const toggleCatalogItem = (item: PharmacyItemApi) => {
    if (selectedCodes.has(item.itemCode)) {
      setMedicines((prev) => prev.filter((m) => m.itemCode !== item.itemCode || m.isManual));
      setExpandedMedicineKeys((prev) => {
        const next = new Set(prev);
        next.delete(item.itemCode);
        return next;
      });
    } else {
      setMedicines((prev) => [...prev, pharmacyMedicine(item)]);
      setExpandedMedicineKeys((prev) => new Set(prev).add(item.itemCode));
      setSelectedPanelExpanded(true);
    }
  };

  const addManualMedicine = () => {
    setMedicines((prev) => {
      const next = [...prev, emptyManualMedicine()];
      setExpandedMedicineKeys((keys) => new Set(keys).add(`manual-${next.length - 1}`));
      return next;
    });
    setSelectedPanelExpanded(true);
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
        showToast('Prescription saved', 'success');
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openPdf = async (audience: 'patient' | 'staff', download = false) => {
    const code = saved?.prescriptionCode;
    if (!code) {
      showToast('Save the prescription first', 'error');
      return;
    }
    try {
      const blob = await patientAdminService.fetchStructuredPrescriptionPdfBlob(
        patientCode,
        code,
        audience
      );
      const url = URL.createObjectURL(blob);
      if (download) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${code}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const pharmacySelected = medicines.filter((m) => !m.isManual);
  const manualMedicines = medicines.filter((m) => m.isManual);

  return (
    <div className="mx-auto w-full max-w-5xl pb-8">
      <Link
        to={patientDetailPath(patientCode)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-sage-deep hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to patient
      </Link>

      <h1 className="font-serif text-2xl font-bold text-sage-deep">New prescription</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Patient {patientCode}
        {appointmentCode ? ` · Visit ${appointmentCode}` : ''}
      </p>

      {loading ? (
        <p className="py-16 text-center text-sm text-ink-soft">Loading pharmacy items…</p>
      ) : (
        <div className="mt-5 space-y-5">
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

          <section className="rounded-xl border border-border-sage bg-white p-4 shadow-sm">
            <h2 className="mb-1 font-serif text-lg font-semibold text-ink">Medicines</h2>
            <p className="mb-4 text-sm text-ink-soft">
              Search pharmacy stock, tick items to add, then set pack quantity and timing for each.
            </p>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Pharmacy catalog */}
              <div className="rounded-xl border border-border-sage bg-cream/20">
                <button
                  type="button"
                  onClick={() => setCatalogExpanded((v) => !v)}
                  className="flex w-full cursor-pointer items-center justify-between border-b border-border-sage px-3 py-3 text-left hover:bg-sage-mist/30"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">Pharmacy items</p>
                    <p className="text-xs text-ink-ghost">
                      {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                      {itemSearch.trim() ? ' matching search' : ' available'}
                    </p>
                  </div>
                  {catalogExpanded ? (
                    <ChevronUp className="h-5 w-5 shrink-0 text-ink-ghost" />
                  ) : (
                    <ChevronDown className="h-5 w-5 shrink-0 text-ink-ghost" />
                  )}
                </button>

                {catalogExpanded ? (
                  <>
                    <div className="border-b border-border-sage px-3 py-3">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-ghost" />
                        <input
                          type="search"
                          value={itemSearch}
                          onChange={(e) => setItemSearch(e.target.value)}
                          placeholder="Search by name, code, company…"
                          className={`${formInputClass} pl-9`}
                        />
                      </div>
                    </div>

                    <ul className="max-h-[min(360px,45vh)] divide-y divide-border-sage overflow-y-auto">
                      {filteredItems.length === 0 ? (
                        <li className="px-4 py-8 text-center text-sm text-ink-soft">
                          No pharmacy items found
                        </li>
                      ) : (
                        paginatedItems.map((item) => {
                          const checked = selectedCodes.has(item.itemCode);
                          return (
                            <li key={item.itemCode}>
                              <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-sage-mist/40">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleCatalogItem(item)}
                                  className="mt-1 h-4 w-4 shrink-0 accent-sage-deep"
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-medium text-ink">{item.name}</span>
                                  <span className="mt-0.5 block text-xs text-ink-ghost">
                                    {item.itemCode}
                                    {item.unitSize ? ` · ${item.unitSize}` : ''}
                                    {item.company ? ` · ${item.company}` : ''}
                                  </span>
                                </span>
                              </label>
                            </li>
                          );
                        })
                      )}
                    </ul>

                    {filteredItems.length > 0 ? (
                      <StaffPagination
                        from={(catalogPage - 1) * CATALOG_PAGE_SIZE + 1}
                        to={Math.min(catalogPage * CATALOG_PAGE_SIZE, filteredItems.length)}
                        total={filteredItems.length}
                        currentPage={catalogPage}
                        totalPages={catalogTotalPages}
                        onPageChange={setCatalogPage}
                        entityLabel="items"
                      />
                    ) : null}
                  </>
                ) : null}
              </div>

              {/* Selected items */}
              <div className="rounded-xl border border-border-sage bg-white">
                <button
                  type="button"
                  onClick={() => setSelectedPanelExpanded((v) => !v)}
                  className="flex w-full cursor-pointer items-center justify-between border-b border-border-sage bg-sage-mist/30 px-4 py-3 text-left hover:bg-sage-mist/50"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      Selected medicines ({medicines.length})
                    </p>
                    <p className="text-xs text-ink-ghost">
                      Adjust pack quantity and timing per item
                    </p>
                  </div>
                  {selectedPanelExpanded ? (
                    <ChevronUp className="h-5 w-5 shrink-0 text-ink-ghost" />
                  ) : (
                    <ChevronDown className="h-5 w-5 shrink-0 text-ink-ghost" />
                  )}
                </button>

                {selectedPanelExpanded ? (
                  <>
                <div className="max-h-[min(360px,45vh)] overflow-y-auto p-3">
                  {medicines.length === 0 ? (
                    <p className="py-10 text-center text-sm text-ink-soft">
                      No medicines selected yet. Tick items from the list on the left.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {medicines.map((med, index) => {
                        const key = medicineKey(med, index);
                        const isExpanded = expandedMedicineKeys.has(key);
                        return (
                        <div
                          key={key}
                          className="rounded-lg border border-border-sage bg-cream/20 p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => toggleMedicineExpanded(key)}
                              className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 text-left"
                            >
                              {isExpanded ? (
                                <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-ink-ghost" />
                              ) : (
                                <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-ink-ghost" />
                              )}
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold text-ink">
                                  {med.name || 'Unnamed'}
                                </span>
                                {med.itemCode ? (
                                  <span className="block text-xs text-ink-ghost">{med.itemCode}</span>
                                ) : (
                                  <span className="block text-xs text-ink-ghost">Manual entry</span>
                                )}
                                {!isExpanded ? (
                                  <span className="mt-1 block text-xs text-ink-soft">
                                    Pack qty: {med.packQuantity} · Total:{' '}
                                    {computeMedicineTotalQty(med.packQuantity, med.timing)}
                                  </span>
                                ) : null}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeMedicine(index)}
                              className="shrink-0 rounded p-1 text-ink-ghost hover:bg-danger-bg hover:text-danger"
                              title="Remove"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {!isExpanded ? (
                            <div className="mt-2 flex flex-wrap items-center gap-3 pl-6">
                              <span className="text-xs font-semibold text-ink-ghost">Pack qty</span>
                              <QtyStepper
                                value={med.packQuantity}
                                onChange={(v) => updateMedicine(index, { packQuantity: v })}
                              />
                            </div>
                          ) : null}

                          {isExpanded ? (
                            <>
                          {med.isManual ? (
                            <input
                              type="text"
                              value={med.name}
                              onChange={(e) => updateMedicine(index, { name: e.target.value })}
                              placeholder="Medicine name"
                              className={`${formInputClass} mb-3 mt-3`}
                            />
                          ) : null}

                          <div className="mb-3 mt-3 flex flex-wrap items-center gap-3">
                            <span className="text-xs font-semibold text-ink-ghost">Pack qty</span>
                            <QtyStepper
                              value={med.packQuantity}
                              onChange={(v) => updateMedicine(index, { packQuantity: v })}
                            />
                            <span className="text-xs text-ink-ghost">
                              Total qty:{' '}
                              <strong className="text-ink">
                                {computeMedicineTotalQty(med.packQuantity, med.timing)}
                              </strong>
                            </span>
                          </div>

                          <p className="mb-1.5 text-xs font-semibold text-ink-ghost">Timing</p>
                          <div className="grid gap-1 sm:grid-cols-2">
                            {TIMING_LABELS.map(({ key: timingKey, label }) => (
                              <label key={timingKey} className="flex items-center gap-2 text-xs">
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
                            </>
                          ) : null}
                        </div>
                      );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t border-border-sage px-3 py-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full gap-1 sm:w-auto"
                    onClick={addManualMedicine}
                  >
                    <Plus className="h-4 w-4" />
                    Add manual medicine
                  </Button>
                </div>
                  </>
                ) : null}
              </div>
            </div>

            {(pharmacySelected.length > 0 || manualMedicines.length > 0) && (
              <p className="mt-3 text-xs text-ink-ghost">
                {pharmacySelected.length} from pharmacy
                {manualMedicines.length > 0 ? ` · ${manualMedicines.length} manual` : ''}
              </p>
            )}
          </section>

          <section className="rounded-xl border border-border-sage bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-ink">Churan</h2>
              <Button
                type="button"
                variant="secondary"
                className="gap-1"
                onClick={() => setChurans((prev) => [...prev, emptyChuran()])}
              >
                <Plus className="h-4 w-4" />
                Add churan
              </Button>
            </div>
            {churans.length === 0 ? (
              <p className="text-sm text-ink-soft">Optional — add churan formulations if needed</p>
            ) : (
              churans.map((ch, index) => (
                <div key={index} className="mb-3 rounded-lg border border-border-sage bg-cream/20 p-3">
                  <input
                    type="text"
                    value={ch.name}
                    onChange={(e) =>
                      setChurans((prev) =>
                        prev.map((c, i) => (i === index ? { ...c, name: e.target.value } : c))
                      )
                    }
                    placeholder="Churan name"
                    className={`${formInputClass} mb-2`}
                  />
                  <textarea
                    value={ch.combination}
                    onChange={(e) =>
                      setChurans((prev) =>
                        prev.map((c, i) => (i === index ? { ...c, combination: e.target.value } : c))
                      )
                    }
                    placeholder="Combination (manual text)"
                    rows={2}
                    className={`${formInputClass} mb-2 resize-none`}
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
          </section>

          <section className="rounded-xl border border-border-sage bg-white p-4 shadow-sm">
            <label className="mb-3 block">
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
                rows={3}
                className={`${formInputClass} resize-none`}
              />
            </label>
          </section>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void handleSave()} disabled={submitting}>
              Save prescription
            </Button>
            <Button type="button" variant="secondary" onClick={handleSaveDraft} disabled={submitting}>
              Save as draft
            </Button>
            {activeDraftId ? (
              <Button type="button" variant="secondary" onClick={handleSaveNewDraft} disabled={submitting}>
                Save as new draft
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              className="gap-1"
              disabled={!saved}
              onClick={() => void openPdf('staff')}
            >
              <Eye className="h-4 w-4" />
              View PDF (staff)
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="gap-1"
              disabled={!saved}
              onClick={() => void openPdf('patient', true)}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionPage;
