import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NumericInput } from '@/components/ui/NumericInput';
import { formInputClass, formLabelClass, formSelectClass } from '@/components/ui/formStyles';
import { billingAdminService } from '@/services/billing/billingAdmin.service';
import { patientAdminService } from '@/services/patient/patientAdmin.service';
import { pharmacyService } from '@/services/pharmacy/pharmacy.service';
import { useToast } from '@/hooks/useToast';
import { useFormDraft } from '@/hooks/useFormDraft';
import { FormDraftPanel } from '@/components/ui/FormDraftPanel';
import { FORM_DRAFT_CATEGORIES, draftContextKeys } from '@/store/formDraftStorage';
import { getApiErrorMessage } from '@/utils/helpers';
import { ROUTES } from '@/constants/routes';
import {
  formatRupee,
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethodType,
} from '@/types/billing.types';
import type { HmsPatient } from '@/types/api.types';
import type { PharmacyItemApi } from '@/types/pharmacy.types';

interface MedicineBillDraft {
  patientCode: string;
  search: string;
  selected: Record<string, number>;
  paymentMethod: PaymentMethodType;
}

const matchesSearch = (item: PharmacyItemApi, query: string) => {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return [item.name, item.itemCode, item.company, item.category, item.unitSize].some((field) =>
    field?.toLowerCase().includes(q)
  );
};

export const MedicineBillPage = () => {
  const { showToast } = useToast();
  const [patients, setPatients] = useState<HmsPatient[]>([]);
  const [items, setItems] = useState<PharmacyItemApi[]>([]);
  const [patientCode, setPatientCode] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('Cash');
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
    setSelected(draft.selected);
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

  const filteredItems = useMemo(
    () => items.filter((item) => matchesSearch(item, search)),
    [items, search]
  );

  const selectedLines = useMemo(
    () =>
      Object.entries(selected)
        .map(([itemCode, quantity]) => {
          const item = items.find((i) => i.itemCode === itemCode);
          if (!item || quantity < 1) return null;
          return { item, quantity, unitPrice: item.salePrice ?? 0 };
        })
        .filter(Boolean) as Array<{ item: PharmacyItemApi; quantity: number; unitPrice: number }>,
    [selected, items]
  );

  const total = selectedLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  const toggleItem = (itemCode: string, checked: boolean) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (checked) next[itemCode] = next[itemCode] ?? 1;
      else delete next[itemCode];
      return next;
    });
  };

  const setQty = (itemCode: string, qty: number) => {
    setSelected((prev) => ({ ...prev, [itemCode]: Math.max(0, qty) }));
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
      if (line.quantity > line.item.stock) {
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
            <div className="relative mb-3">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-ghost"
                strokeWidth={1.75}
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search medicines…"
                className={`${formInputClass} pl-9`}
              />
            </div>

            <div className="max-h-80 overflow-y-auto rounded-lg border border-border-sage">
              {filteredItems.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-ink-soft">No medicines found</p>
              ) : (
                <ul className="divide-y divide-border-sage/60">
                  {filteredItems.map((item) => {
                    const checked = item.itemCode in selected;
                    const disabled = item.stock < 1 || (item.salePrice ?? 0) <= 0;
                    return (
                      <li key={item.itemCode} className="px-3 py-3">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={(e) => toggleItem(item.itemCode, e.target.checked)}
                            className="mt-1"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-ink">{item.name}</p>
                            <p className="text-[11px] text-ink-ghost">
                              {item.unitSize ? `${item.unitSize} · ` : ''}
                              stock: {item.stock} ·{' '}
                              {(item.salePrice ?? 0) > 0
                                ? formatRupee(item.salePrice!)
                                : 'No price'}
                            </p>
                          </div>
                          {checked ? (
                            <div className="w-20 shrink-0">
                              <label className="text-[11px] font-semibold text-ink-ghost">Qty</label>
                              <NumericInput
                                value={selected[item.itemCode] ?? 1}
                                onChange={(qty) => setQty(item.itemCode, qty)}
                                min={1}
                                max={item.stock}
                                className="mt-0.5 px-2 py-1"
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
                {selectedLines.map(({ item, quantity, unitPrice }) => (
                  <li key={item.itemCode} className="flex justify-between gap-2">
                    <span>
                      {item.name} × {quantity}
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
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
              className={formSelectClass}
            >
              {PAYMENT_METHOD_OPTIONS.map((m) => (
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
