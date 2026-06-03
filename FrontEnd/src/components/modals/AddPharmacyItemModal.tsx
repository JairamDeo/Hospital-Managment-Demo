import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormSelect } from '@/components/ui/FormSelect';
import { formInputClass, formLabelClass } from '@/components/ui/formStyles';
import type { MasterItem } from '@/types/api.types';
import type { PharmacyItemFormValues } from '@/types/pharmacy.types';

interface Props {
  open: boolean;
  initial: PharmacyItemFormValues;
  categories: MasterItem[];
  units: MasterItem[];
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: PharmacyItemFormValues) => void | Promise<void>;
}

export const AddPharmacyItemModal = ({
  open,
  initial,
  categories,
  units,
  saving = false,
  onClose,
  onSubmit,
}: Props) => {
  const [form, setForm] = useState<PharmacyItemFormValues>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof PharmacyItemFormValues, string>>>({});

  useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  const validate = () => {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = 'Item name is required';
    if (!form.categoryId) next.categoryId = 'Category is required';
    if (!form.unitId) next.unitId = 'Pack unit is required';
    const packQty = Number(form.packQuantity);
    if (!form.packQuantity.trim() || Number.isNaN(packQty) || packQty <= 0) {
      next.packQuantity = 'Pack quantity must be greater than 0';
    }
    const stockQty = Number(form.stock);
    if (form.stock.trim() === '' || Number.isNaN(stockQty) || stockQty < 0) {
      next.stock = 'Stock is required';
    }
    if (!form.manufacturingDate) {
      next.manufacturingDate = 'Manufacturing date is required';
    }
    const hasExpiry = Boolean(form.expiryDate);
    const months = Number(form.bestBeforeMonths);
    const hasMonths = form.bestBeforeMonths.trim() !== '' && !Number.isNaN(months) && months > 0;
    if (!hasExpiry && !hasMonths) {
      next.expiryDate = 'Enter expiry date or best-before months';
      next.bestBeforeMonths = 'Enter expiry date or best-before months';
    }
    if (hasExpiry && hasMonths && form.manufacturingDate && form.expiryDate) {
      if (new Date(form.expiryDate) < new Date(form.manufacturingDate)) {
        next.expiryDate = 'Expiry must be after manufacturing date';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(form);
  };

  const set = <K extends keyof PharmacyItemFormValues>(
    key: K,
    value: PharmacyItemFormValues[K]
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const categoryOptions = categories
    .filter((c) => c.active !== false)
    .map((c) => ({ value: c._id, label: c.name }));

  const unitOptions = units
    .filter((u) => u.active !== false)
    .map((u) => ({ value: u._id, label: u.name }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Inventory Item"
      subtitle="Add a new herb or medicine to inventory"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={saving}>
            Add Inventory Item
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={formLabelClass}>Item Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className={`${formInputClass} ${errors.name ? 'border-danger' : ''}`}
            placeholder="e.g. Brahmi Oil"
          />
          {errors.name ? <p className="mt-1 text-xs text-danger">{errors.name}</p> : null}
        </div>

        <div className="sm:col-span-2">
          <label className={formLabelClass}>Company / Brand</label>
          <input
            type="text"
            value={form.company}
            onChange={(e) => set('company', e.target.value)}
            className={formInputClass}
            placeholder="e.g. Dabur India, Himalaya Wellness"
          />
          <p className="mt-1 text-[11px] text-ink-ghost">
            Required when the same medicine exists from another manufacturer
          </p>
        </div>

        <div className="sm:col-span-2">
          <FormSelect
            label="Category *"
            value={form.categoryId}
            onChange={(value) => set('categoryId', value)}
            options={categoryOptions}
            placeholder={
              categoryOptions.length ? 'Select category' : 'Add categories in Master Data first'
            }
            error={errors.categoryId}
          />
        </div>

        <div>
          <label className={formLabelClass}>Pack quantity *</label>
          <input
            type="number"
            min={0.01}
            step="any"
            value={form.packQuantity}
            onChange={(e) => set('packQuantity', e.target.value)}
            className={`${formInputClass} ${errors.packQuantity ? 'border-danger' : ''}`}
            placeholder="e.g. 200, 500, 1"
          />
          {errors.packQuantity ? (
            <p className="mt-1 text-xs text-danger">{errors.packQuantity}</p>
          ) : null}
        </div>

        <div>
          <FormSelect
            label="Pack unit *"
            value={form.unitId}
            onChange={(value) => set('unitId', value)}
            options={unitOptions}
            placeholder={
              unitOptions.length ? 'Select unit (ml, g, L…)' : 'Add units in Master Data first'
            }
            error={errors.unitId}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={formLabelClass}>Stock (units in inventory) *</label>
          <input
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) => set('stock', e.target.value)}
            className={`${formInputClass} ${errors.stock ? 'border-danger' : ''}`}
            placeholder="e.g. 100"
          />
          {errors.stock ? <p className="mt-1 text-xs text-danger">{errors.stock}</p> : null}
        </div>

        <div>
          <label className={formLabelClass}>Manufacturing date *</label>
          <input
            type="date"
            value={form.manufacturingDate}
            onChange={(e) => set('manufacturingDate', e.target.value)}
            className={`${formInputClass} ${errors.manufacturingDate ? 'border-danger' : ''}`}
          />
          {errors.manufacturingDate ? (
            <p className="mt-1 text-xs text-danger">{errors.manufacturingDate}</p>
          ) : null}
        </div>

        <div>
          <label className={formLabelClass}>Expiry date</label>
          <input
            type="date"
            value={form.expiryDate}
            onChange={(e) => set('expiryDate', e.target.value)}
            className={`${formInputClass} ${errors.expiryDate ? 'border-danger' : ''}`}
          />
          {errors.expiryDate ? <p className="mt-1 text-xs text-danger">{errors.expiryDate}</p> : null}
        </div>

        <div className="sm:col-span-2">
          <label className={formLabelClass}>Best before (months from manufacturing)</label>
          <input
            type="number"
            min={1}
            value={form.bestBeforeMonths}
            onChange={(e) => set('bestBeforeMonths', e.target.value)}
            className={`${formInputClass} ${errors.bestBeforeMonths ? 'border-danger' : ''}`}
            placeholder="e.g. 24 (use this OR expiry date above)"
          />
          {errors.bestBeforeMonths ? (
            <p className="mt-1 text-xs text-danger">{errors.bestBeforeMonths}</p>
          ) : (
            <p className="mt-1 text-[11px] text-ink-ghost">
              Shelf life in months — system calculates expiry if expiry date is left empty
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
