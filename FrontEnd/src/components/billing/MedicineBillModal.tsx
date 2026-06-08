import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Search, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NumericInput } from '@/components/ui/NumericInput';
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
import { formatRupee, PAYMENT_METHOD_OPTIONS, type PaymentMethodType } from '@/types/billing.types';
import type { HmsPatient } from '@/types/api.types';
import type { PharmacyItemApi } from '@/types/pharmacy.types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface LineRow {
  itemCode: string;
  name: string;
  packLabel: string;
  quantity: number;
  unitPrice: number;
  stock: number;
}

interface MedicineBillModalDraft {
  patientCode: string;
  search: string;
  lines: LineRow[];
  paymentMethod: PaymentMethodType;
}

export const MedicineBillModal = ({ open, onClose, onCreated }: Props) => {
  const { showToast } = useToast();
  const [patients, setPatients] = useState<HmsPatient[]>([]);
  const [items, setItems] = useState<PharmacyItemApi[]>([]);
  const [patientCode, setPatientCode] = useState('');
  const [lines, setLines] = useState<LineRow[]>([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [qty, setQty] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('Cash');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const buildDraftLabel = useCallback(
    (draft: MedicineBillModalDraft) => {
      const patient = patients.find((p) => p.patientCode === draft.patientCode);
      const name = patient?.name ?? (draft.patientCode || 'No patient');
      return `${name} · ${draft.lines.length} medicine${draft.lines.length === 1 ? '' : 's'}`;
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
  } = useFormDraft<MedicineBillModalDraft>(FORM_DRAFT_CATEGORIES.medicineBillModal, {
    buildLabel: buildDraftLabel,
  });

  const draftPayload = (): MedicineBillModalDraft => ({
    patientCode,
    search,
    lines,
    paymentMethod,
  });

  const applyDraft = (draft: MedicineBillModalDraft) => {
    setPatientCode(draft.patientCode);
    setSearch(draft.search);
    setLines(draft.lines);
    setPaymentMethod(draft.paymentMethod ?? 'Cash');
  };

  const handleSaveDraft = () => {
    saveDraft(draftPayload(), {
      contextKey: patientCode ? draftContextKeys.patient(patientCode) : 'unsaved',
    });
    showToast('Medicine bill draft saved', 'success');
  };

  const handleSaveNewDraft = () => {
    saveNewDraft(draftPayload(), {
      contextKey: patientCode ? draftContextKeys.patient(patientCode) : 'unsaved',
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
    if (!open) return;
    setSearch('');
    setSelectedItem('');
    setQty(1);
    setLoading(true);
    Promise.all([patientAdminService.list(), pharmacyService.getBillingItems()])
      .then(([patRes, pharmRes]) => {
        setPatients(patRes.data.res?.patients ?? []);
        setItems(pharmRes.data.res?.items ?? []);
      })
      .catch((err) => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [open, showToast]);

  const searchQuery = debouncedSearch.trim();
  const searchResults = useMemo(
    () => searchPharmacyItems(items, debouncedSearch),
    [items, debouncedSearch]
  );
  const isSearching =
    search.trim() !== debouncedSearch.trim() && search.trim().length >= PHARMACY_SEARCH_MIN_CHARS;
  const showSearchPrompt = search.trim().length < PHARMACY_SEARCH_MIN_CHARS;
  const hasMoreResults = searchResults.length >= PHARMACY_SEARCH_MAX_RESULTS;

  const selected = items.find((i) => i.itemCode === selectedItem) ?? null;
  const unitPrice = selected?.salePrice ?? 0;
  const previewTotal = unitPrice > 0 && qty > 0 ? unitPrice * qty : 0;

  const total = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  const lineQtyInBill = (itemCode: string) =>
    lines.find((l) => l.itemCode === itemCode)?.quantity ?? 0;

  const addLine = () => {
    if (!selected) {
      showToast('Select a medicine from the list', 'error');
      return;
    }
    const price = selected.salePrice ?? 0;
    if (price <= 0) {
      showToast(`Set sale price for ${selected.name} in pharmacy first`, 'error');
      return;
    }
    if (qty < 1) {
      showToast('Quantity must be at least 1', 'error');
      return;
    }
    const alreadyAdded = lineQtyInBill(selected.itemCode);
    if (alreadyAdded + qty > selected.stock) {
      showToast(`Insufficient stock (available: ${selected.stock})`, 'error');
      return;
    }
    if (selected.stock < 1) {
      showToast(`${selected.name} is out of stock`, 'error');
      return;
    }

    setLines((prev) => {
      const existing = prev.find((l) => l.itemCode === selected.itemCode);
      if (existing) {
        return prev.map((l) =>
          l.itemCode === selected.itemCode ? { ...l, quantity: l.quantity + qty } : l
        );
      }
      return [
        ...prev,
        {
          itemCode: selected.itemCode,
          name: selected.name,
          packLabel: selected.unitSize || '',
          quantity: qty,
          unitPrice: price,
          stock: selected.stock,
        },
      ];
    });
    setQty(1);
    setSelectedItem('');
  };

  const removeLine = (itemCode: string) => {
    setLines((prev) => prev.filter((l) => l.itemCode !== itemCode));
  };

  const handleSubmit = async () => {
    if (!patientCode) {
      showToast('Select a patient', 'error');
      return;
    }
    if (!lines.length) {
      showToast('Add at least one medicine', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await billingAdminService.createMedicineBill({
        patientCode,
        items: lines.map((l) => ({
          itemCode: l.itemCode,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
        markPaid: true,
        paymentMethod,
      });
      showToast('Medicine bill created', 'success');
      clearDraftAfterSubmit(patientCode ? draftContextKeys.patient(patientCode) : undefined);
      setLines([]);
      setPatientCode('');
      setSearch('');
      setSelectedItem('');
      onCreated();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border-sage bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border-sage px-5 py-4">
          <div>
            <h2 className="font-serif text-lg font-semibold text-ink">New medicine bill</h2>
            <p className="text-xs text-ink-ghost">Non-expired pharmacy items only</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-ink-ghost hover:bg-sage-mist"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-ink-soft">Loading medicines…</p>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
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
              <span className="mb-1 block text-xs font-semibold text-ink-ghost">Patient</span>
              <select
                value={patientCode}
                onChange={(e) => setPatientCode(e.target.value)}
                className="w-full rounded-lg border border-border-sage px-3 py-2 text-sm"
              >
                <option value="">Select patient…</option>
                {patients.map((p) => (
                  <option key={p.patientCode} value={p.patientCode}>
                    {p.name} ({p.patientCode})
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-xl border border-border-sage bg-cream/30 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-ink-ghost">Add medicines</p>
                {!showSearchPrompt && !isSearching ? (
                  <p className="text-xs text-ink-ghost">
                    {searchResults.length} result{searchResults.length === 1 ? '' : 's'}
                    {hasMoreResults ? ' (refine search)' : ''}
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
                  className="w-full rounded-lg border border-border-sage py-2 pl-9 pr-9 text-sm"
                  autoComplete="off"
                />
                {isSearching ? (
                  <Loader2
                    className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-ghost"
                    strokeWidth={2}
                  />
                ) : null}
              </div>

              <div className="max-h-48 overflow-y-auto rounded-lg border border-border-sage bg-white">
                {showSearchPrompt ? (
                  <p className="px-3 py-8 text-center text-sm text-ink-soft">
                    Type at least {PHARMACY_SEARCH_MIN_CHARS} characters to find medicines
                  </p>
                ) : isSearching ? (
                  <p className="px-3 py-8 text-center text-sm text-ink-soft">Searching…</p>
                ) : searchResults.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-ink-soft">
                    No medicines found for &ldquo;{searchQuery}&rdquo;
                  </p>
                ) : (
                  <ul className="divide-y divide-border-sage/60">
                    {searchResults.map((item) => {
                      const isSelected = selectedItem === item.itemCode;
                      const outOfStock = item.stock < 1;
                      const noPrice = (item.salePrice ?? 0) <= 0;
                      const disabled = outOfStock || noPrice;
                      return (
                        <li key={item.itemCode}>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => setSelectedItem(item.itemCode)}
                            className={`flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                              isSelected
                                ? 'bg-sage-mist/70 ring-1 ring-inset ring-sage-deep/30'
                                : disabled
                                  ? 'cursor-not-allowed opacity-50'
                                  : 'hover:bg-sage-mist/40'
                            }`}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="font-medium text-ink">{item.name}</span>
                              <span className="mt-0.5 block text-[11px] text-ink-ghost">
                                {item.itemCode}
                                {item.unitSize ? ` · ${item.unitSize}` : ''}
                                {item.company ? ` · ${item.company}` : ''}
                                {' · '}stock: {item.stock}
                                {item.expiryDate ? ` · exp: ${item.expiryDate}` : ''}
                              </span>
                            </span>
                            <span className="shrink-0 text-right">
                              {(item.salePrice ?? 0) > 0 ? (
                                <span className="font-semibold text-sage-deep">
                                  {formatRupee(item.salePrice!)}
                                </span>
                              ) : (
                                <span className="text-[11px] text-danger">No price</span>
                              )}
                              <span className="block text-[10px] text-ink-ghost">per pack</span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-end gap-2">
                <div className="w-24">
                  <label className="mb-1 block text-[11px] font-semibold text-ink-ghost">Qty</label>
                  <NumericInput
                    value={qty}
                    onChange={setQty}
                    min={1}
                    className="px-2 py-1.5"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addLine}
                  disabled={!selected || unitPrice <= 0}
                >
                  Add to bill
                </Button>
                {selected && unitPrice > 0 && qty > 0 ? (
                  <p className="ml-auto text-sm text-ink-soft">
                    {formatRupee(unitPrice)} × {qty} ={' '}
                    <span className="font-semibold text-ink">{formatRupee(previewTotal)}</span>
                  </p>
                ) : null}
              </div>
            </div>

            {lines.length > 0 ? (
              <div className="rounded-xl border border-border-sage bg-white p-3">
                <p className="mb-2 text-xs font-semibold text-ink-ghost">Bill summary</p>
                <ul className="space-y-2 text-sm">
                  {lines.map((line) => (
                    <li
                      key={line.itemCode}
                      className="flex items-start justify-between gap-2 rounded-lg bg-sage-mist/40 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{line.name}</p>
                        <p className="text-[11px] text-ink-ghost">
                          {line.packLabel ? `${line.packLabel} · ` : ''}
                          {formatRupee(line.unitPrice)}/pack × {line.quantity}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-semibold">
                          {formatRupee(line.unitPrice * line.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeLine(line.itemCode)}
                          className="rounded p-1 text-ink-ghost hover:bg-white hover:text-danger"
                          aria-label={`Remove ${line.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between border-t border-border-sage pt-3">
                  <span className="font-semibold text-ink">Total</span>
                  <span className="text-lg font-bold text-sage-deep">{formatRupee(total)}</span>
                </div>
              </div>
            ) : null}

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-ink-ghost">Payment method</span>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                className="w-full rounded-lg border border-border-sage px-3 py-2 text-sm"
              >
                {PAYMENT_METHOD_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="flex shrink-0 gap-2 border-t border-border-sage px-5 py-4">
          <Button
            onClick={() => void handleSubmit()}
            disabled={submitting || loading || lines.length === 0}
          >
            Create bill {lines.length > 0 ? `· ${formatRupee(total)}` : ''}
          </Button>
          <Button type="button" variant="secondary" onClick={handleSaveDraft} disabled={submitting}>
            Save as draft
          </Button>
          {activeDraftId ? (
            <Button type="button" variant="secondary" onClick={handleSaveNewDraft} disabled={submitting}>
              Save as new draft
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
