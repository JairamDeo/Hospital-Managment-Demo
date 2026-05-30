import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formInputClass, formLabelClass, formSelectClass } from '@/components/ui/formStyles';
import { ROLE_OPTIONS, type StaffFormValues } from '@/pages/staff/data/mockStaff';

interface Props {
  open: boolean;
  initial: StaffFormValues;
  onClose: () => void;
  onSubmit: (values: StaffFormValues) => void;
}

export const AddStaffModal = ({ open, initial, onClose, onSubmit }: Props) => {
  const [form, setForm] = useState<StaffFormValues>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof StaffFormValues, string>>>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.title.trim()) next.title = 'Title is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(form);
  };

  const set = <K extends keyof StaffFormValues>(key: K, value: StaffFormValues[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Staff"
      subtitle="Add a new team member to the directory"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Staff</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={formLabelClass}>Full Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className={`${formInputClass} ${errors.name ? 'border-danger' : ''}`}
            placeholder="Dr. Name or staff name"
          />
          {errors.name ? <p className="mt-1 text-xs text-danger">{errors.name}</p> : null}
        </div>

        <div>
          <label className={formLabelClass}>Role *</label>
          <select
            value={form.role}
            onChange={(e) => set('role', e.target.value as StaffFormValues['role'])}
            className={formSelectClass}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={formLabelClass}>Shift</label>
          <input
            type="text"
            value={form.shift}
            onChange={(e) => set('shift', e.target.value)}
            className={formInputClass}
            placeholder="9AM – 5PM"
          />
        </div>

        <div className="sm:col-span-2">
          <label className={formLabelClass}>Title / Specialty *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            className={`${formInputClass} ${errors.title ? 'border-danger' : ''}`}
            placeholder="e.g. Chief Physician · OPD"
          />
          {errors.title ? <p className="mt-1 text-xs text-danger">{errors.title}</p> : null}
        </div>
      </div>
    </Modal>
  );
};
