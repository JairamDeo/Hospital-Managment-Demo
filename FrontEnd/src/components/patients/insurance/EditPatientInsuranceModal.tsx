import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formInputClass, formLabelClass, formSelectClass, formTextareaClass } from '@/components/ui/formStyles';
import type {
  InsuranceDependentFormRow,
  PatientInsuranceFormValues,
  PatientInsuranceRow,
} from '@/types/patientInsurance.types';
import { emptyDependentRow, emptyInsuranceForm, insuranceFormFromRow } from '@/types/patientInsurance.types';

interface Props {
  open: boolean;
  row: PatientInsuranceRow | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (values: PatientInsuranceFormValues) => void | Promise<void>;
}

const POLICY_TYPES = ['Individual', 'Family', 'Group'] as const;
const STATUSES = ['Active', 'Expired', 'Pending', 'Cancelled'] as const;

export const EditPatientInsuranceModal = ({
  open,
  row,
  saving = false,
  onClose,
  onSave,
}: Props) => {
  const [form, setForm] = useState<PatientInsuranceFormValues>(emptyInsuranceForm());

  useEffect(() => {
    if (open && row) setForm(insuranceFormFromRow(row));
  }, [open, row]);

  const set = <K extends keyof PatientInsuranceFormValues>(key: K, value: PatientInsuranceFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addDependent = () =>
    setForm((f) => ({ ...f, dependents: [...f.dependents, emptyDependentRow()] }));

  const updateDependent = (index: number, patch: Partial<InsuranceDependentFormRow>) =>
    setForm((f) => ({
      ...f,
      dependents: f.dependents.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    }));

  const removeDependent = (index: number) =>
    setForm((f) => ({
      ...f,
      dependents: f.dependents.filter((_, i) => i !== index),
    }));

  const handleSave = () => {
    if (!form.providerName.trim() || !form.policyNumber.trim()) return;
    onSave(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={row ? `Health insurance — ${row.name}` : 'Health insurance'}
      subtitle={
        row
          ? `${row.patientCode}${row.age ? ` · ${row.age}y` : ''} · ${row.gender}`
          : undefined
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            isLoading={saving}
            disabled={!form.providerName.trim() || !form.policyNumber.trim()}
          >
            Save policy
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Insurance provider *"
          value={form.providerName}
          onChange={(e) => set('providerName', e.target.value)}
          placeholder="e.g. Star Health, ICICI Lombard"
        />
        <Input
          label="Policy number *"
          value={form.policyNumber}
          onChange={(e) => set('policyNumber', e.target.value)}
          placeholder="Policy / member ID"
        />
        <div>
          <label className={formLabelClass}>Policy type</label>
          <select
            className={formSelectClass}
            value={form.policyType}
            onChange={(e) => set('policyType', e.target.value as PatientInsuranceFormValues['policyType'])}
          >
            {POLICY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={formLabelClass}>Status</label>
          <select
            className={formSelectClass}
            value={form.status}
            onChange={(e) => set('status', e.target.value as PatientInsuranceFormValues['status'])}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Sum insured (₹)"
          type="number"
          min={0}
          value={form.sumInsured}
          onChange={(e) => set('sumInsured', e.target.value)}
          placeholder="e.g. 500000"
        />
        <Input
          label="Annual premium (₹)"
          type="number"
          min={0}
          value={form.annualPremium}
          onChange={(e) => set('annualPremium', e.target.value)}
          placeholder="e.g. 12000"
        />
        <div>
          <label className={formLabelClass}>Policy start date</label>
          <input
            type="date"
            className={formSelectClass}
            value={form.startDate}
            onChange={(e) => set('startDate', e.target.value)}
          />
        </div>
        <div>
          <label className={formLabelClass}>Policy end / renewal date</label>
          <input
            type="date"
            className={formSelectClass}
            value={form.endDate}
            onChange={(e) => set('endDate', e.target.value)}
          />
        </div>
        <Input
          label="TPA name"
          value={form.tpaName}
          onChange={(e) => set('tpaName', e.target.value)}
          placeholder="Third party administrator (optional)"
        />
        <Input
          label="Health card number"
          value={form.cardNumber}
          onChange={(e) => set('cardNumber', e.target.value)}
          placeholder="Card / UHID number"
        />
        <div className="sm:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <label className={formLabelClass}>Covered dependents</label>
            <button
              type="button"
              onClick={addDependent}
              className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-sage-deep hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Add dependent
            </button>
          </div>
          <div className="space-y-2 rounded-xl border border-border-sage bg-cream/20 p-3">
            {form.dependents.length === 0 ? (
              <p className="py-2 text-center text-xs text-ink-ghost">
                No dependents added. Click &quot;Add dependent&quot; to include family members.
              </p>
            ) : (
              form.dependents.map((dep, index) => (
                <div key={index} className="flex flex-wrap items-start gap-2">
                  <input
                    type="text"
                    value={dep.name}
                    onChange={(e) => updateDependent(index, { name: e.target.value })}
                    className={`${formInputClass} min-w-0 flex-1`}
                    placeholder="Full name"
                  />
                  <input
                    type="text"
                    value={dep.relation}
                    onChange={(e) => updateDependent(index, { relation: e.target.value })}
                    className={`${formInputClass} w-28 shrink-0`}
                    placeholder="Relation"
                  />
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={dep.age}
                    onChange={(e) => updateDependent(index, { age: e.target.value })}
                    className={`${formInputClass} w-20 shrink-0`}
                    placeholder="Age"
                  />
                  <button
                    type="button"
                    onClick={() => removeDependent(index)}
                    className="rounded p-2 text-ink-ghost hover:text-danger"
                    aria-label="Remove dependent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className={formLabelClass}>Notes</label>
          <textarea
            className={formTextareaClass}
            rows={2}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Coverage details, exclusions, billing remarks…"
          />
        </div>
      </div>
    </Modal>
  );
};
