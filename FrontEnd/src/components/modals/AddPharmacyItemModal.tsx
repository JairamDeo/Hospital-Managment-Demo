import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formInputClass, formLabelClass, formSelectClass } from '@/components/ui/formStyles';
import {
  CATEGORY_OPTIONS,
  type PharmacyItemFormValues,
} from '@/pages/pharmacy/data/mockPharmacy';

interface Props {
  open: boolean;
  initial: PharmacyItemFormValues;
  onClose: () => void;
  onSubmit: (values: PharmacyItemFormValues) => void;
}

export const AddPharmacyItemModal = ({ open, initial, onClose, onSubmit }: Props) => {
  const [form, setForm] = useState<PharmacyItemFormValues>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof PharmacyItemFormValues, string>>>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = 'Item name is required';
    if (form.stock < 0) next.stock = 'Invalid stock';
    if (form.maxStock < 1) next.maxStock = 'Max stock must be at least 1';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(form);
  };

  const set = <K extends keyof PharmacyItemFormValues>(key: K, value: PharmacyItemFormValues[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Item"
      subtitle="Add a new herb or medicine to inventory"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Item</Button>
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
          <label className={formLabelClass}>Category *</label>
          <select
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className={formSelectClass}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={formLabelClass}>Current Stock *</label>
          <input
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) => set('stock', parseInt(e.target.value, 10) || 0)}
            className={`${formInputClass} ${errors.stock ? 'border-danger' : ''}`}
          />
        </div>

        <div>
          <label className={formLabelClass}>Max Stock *</label>
          <input
            type="number"
            min={1}
            value={form.maxStock}
            onChange={(e) => set('maxStock', parseInt(e.target.value, 10) || 0)}
            className={`${formInputClass} ${errors.maxStock ? 'border-danger' : ''}`}
          />
        </div>
      </div>
    </Modal>
  );
};
