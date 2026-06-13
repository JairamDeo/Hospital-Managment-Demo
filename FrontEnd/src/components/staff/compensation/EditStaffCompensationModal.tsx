import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formInputClass, formLabelClass } from '@/components/ui/formStyles';
import type { StaffCompensationFormValues, StaffCompensationRow } from '@/types/staffCompensation.types';
import { emptyCompensationForm } from '@/types/staffCompensation.types';
import { formTotalsPreview, formatPay, rowToCompensationForm } from '@/utils/staffCompensation.util';

interface Props {
  open: boolean;
  row: StaffCompensationRow | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (values: StaffCompensationFormValues) => void | Promise<void>;
}

const EARNING_FIELDS: { key: keyof StaffCompensationFormValues; label: string }[] = [
  { key: 'basicSalary', label: 'Basic salary' },
  { key: 'hra', label: 'HRA (house rent allowance)' },
  { key: 'dearnessAllowance', label: 'Dearness allowance (DA)' },
  { key: 'specialAllowance', label: 'Special allowance' },
  { key: 'transportAllowance', label: 'Transport allowance' },
  { key: 'medicalAllowance', label: 'Medical allowance' },
  { key: 'otherAllowances', label: 'Other allowances' },
];

const DEDUCTION_FIELDS: { key: keyof StaffCompensationFormValues; label: string }[] = [
  { key: 'pfDeduction', label: 'PF deduction' },
  { key: 'professionalTax', label: 'Professional tax' },
  { key: 'otherDeductions', label: 'Other deductions' },
];

export const EditStaffCompensationModal = ({ open, row, saving = false, onClose, onSave }: Props) => {
  const [form, setForm] = useState<StaffCompensationFormValues>(emptyCompensationForm());

  useEffect(() => {
    if (open && row) setForm(rowToCompensationForm(row));
  }, [open, row]);

  const totals = useMemo(() => formTotalsPreview(form), [form]);

  const set = (key: keyof StaffCompensationFormValues, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  if (!row) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit compensation"
      subtitle={`${row.name} · ${row.role} · ${row.staffCode}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void onSave(form)} isLoading={saving}>
            Save compensation
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 rounded-xl border border-border-sage bg-sage-mist/30 p-4 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">Gross / month</p>
            <p className="text-lg font-semibold text-ink">{formatPay(totals.grossMonthly)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">Deductions</p>
            <p className="text-lg font-semibold text-ink">{formatPay(totals.totalDeductions)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">Net / month</p>
            <p className="text-lg font-semibold text-sage-deep">{formatPay(totals.netMonthly)}</p>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-ghost">Monthly earnings</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {EARNING_FIELDS.map(({ key, label }) => (
              <label key={key}>
                <span className={formLabelClass}>{label} (₹)</span>
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  className={formInputClass}
                  placeholder="0"
                />
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-ghost">Monthly deductions</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {DEDUCTION_FIELDS.map(({ key, label }) => (
              <label key={key}>
                <span className={formLabelClass}>{label} (₹)</span>
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  className={formInputClass}
                  placeholder="0"
                />
              </label>
            ))}
          </div>
        </div>

        {row.role === 'Doctor' ? (
          <div className="border-t border-border-sage pt-4">
            <label>
              <span className={formLabelClass}>Consultation fee (₹ per visit)</span>
              <input
                type="number"
                min={0}
                step="1"
                value={form.consultationFee}
                onChange={(e) => set('consultationFee', e.target.value)}
                className={formInputClass}
                placeholder="e.g. 500"
              />
              <p className="mt-1 text-[11px] text-ink-ghost">
                OPD billing fee — separate from monthly salary
              </p>
            </label>
          </div>
        ) : null}
      </div>
    </Modal>
  );
};
