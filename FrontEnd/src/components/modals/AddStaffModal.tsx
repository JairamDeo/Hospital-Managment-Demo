import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formInputClass, formLabelClass, formSelectClass } from '@/components/ui/formStyles';
import {
  QUALIFICATION_LEVEL_OPTIONS,
  ROLE_OPTIONS,
  type QualificationLevel,
  type StaffFormValues,
  type StaffQualification,
} from '@/types/staff.types';

interface Props {
  open: boolean;
  mode?: 'add' | 'edit';
  initial: StaffFormValues;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: StaffFormValues) => void | Promise<void>;
}

const needsRegistration = (role: StaffFormValues['role']) =>
  role === 'Doctor' || role === 'Therapist';

export const AddStaffModal = ({
  open,
  mode = 'add',
  initial,
  submitting = false,
  onClose,
  onSubmit,
}: Props) => {
  const [form, setForm] = useState<StaffFormValues>(initial);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    if (open) {
      setForm(initial);
      setErrors({});
    }
  }, [open, initial]);

  const validate = () => {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.title.trim()) next.title = 'Title is required';
    if (!/^[0-9]{12}$/.test(form.aadharNumber.replace(/\s/g, ''))) {
      next.aadharNumber = 'Valid 12-digit Aadhar is required';
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(form.panNumber.trim())) {
      next.panNumber = 'Valid PAN is required (e.g. ABCDE1234F)';
    }
    if (needsRegistration(form.role) && !form.registrationNumber.trim()) {
      next.registrationNumber = 'Registration number is required';
    }
    const validQuals = form.qualifications.filter((q) => q.degree.trim());
    if (!validQuals.length) {
      next.qualifications = 'Add at least one qualification with degree name';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      ...form,
      aadharNumber: form.aadharNumber.replace(/\s/g, ''),
      panNumber: form.panNumber.trim().toUpperCase(),
      qualifications: form.qualifications.filter((q) => q.degree.trim()),
    });
  };

  const set = <K extends keyof StaffFormValues>(key: K, value: StaffFormValues[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const updateQualification = (index: number, patch: Partial<StaffQualification>) => {
    setForm((f) => ({
      ...f,
      qualifications: f.qualifications.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    }));
    setErrors((e) => ({ ...e, qualifications: undefined }));
  };

  const addQualification = () => {
    setForm((f) => ({
      ...f,
      qualifications: [...f.qualifications, { level: 'UG' as QualificationLevel, degree: '' }],
    }));
  };

  const removeQualification = (index: number) => {
    setForm((f) => ({
      ...f,
      qualifications: f.qualifications.filter((_, i) => i !== index),
    }));
  };

  const isEdit = mode === 'edit';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Staff' : 'Add Staff'}
      subtitle={
        isEdit ? 'Update team member profile and credentials' : 'Add a new team member to the directory'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (isEdit ? 'Saving…' : 'Adding…') : isEdit ? 'Save Changes' : 'Add Staff'}
          </Button>
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
            placeholder="e.g. Ayurveda, Yoga & Naturopathy"
          />
          {errors.title ? <p className="mt-1 text-xs text-danger">{errors.title}</p> : null}
        </div>

        {needsRegistration(form.role) ? (
          <div className="sm:col-span-2">
            <label className={formLabelClass}>Registration number *</label>
            <input
              type="text"
              value={form.registrationNumber}
              onChange={(e) => set('registrationNumber', e.target.value)}
              className={`${formInputClass} ${errors.registrationNumber ? 'border-danger' : ''}`}
              placeholder="e.g. I-8874-A"
            />
            {errors.registrationNumber ? (
              <p className="mt-1 text-xs text-danger">{errors.registrationNumber}</p>
            ) : null}
          </div>
        ) : null}

        <div>
          <label className={formLabelClass}>Aadhar number *</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={12}
            value={form.aadharNumber}
            onChange={(e) => set('aadharNumber', e.target.value.replace(/\D/g, '').slice(0, 12))}
            className={`${formInputClass} ${errors.aadharNumber ? 'border-danger' : ''}`}
            placeholder="12-digit Aadhar"
          />
          {errors.aadharNumber ? (
            <p className="mt-1 text-xs text-danger">{errors.aadharNumber}</p>
          ) : null}
        </div>

        <div>
          <label className={formLabelClass}>PAN *</label>
          <input
            type="text"
            maxLength={10}
            value={form.panNumber}
            onChange={(e) => set('panNumber', e.target.value.toUpperCase().slice(0, 10))}
            className={`${formInputClass} ${errors.panNumber ? 'border-danger' : ''}`}
            placeholder="ABCDE1234F"
          />
          {errors.panNumber ? <p className="mt-1 text-xs text-danger">{errors.panNumber}</p> : null}
        </div>

        <div className="sm:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <label className={formLabelClass}>Qualifications *</label>
            <button
              type="button"
              onClick={addQualification}
              className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-sage-deep hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Add qualification
            </button>
          </div>
          <div className="space-y-2 rounded-xl border border-border-sage bg-cream/20 p-3">
            {form.qualifications.map((q, index) => (
              <div key={index} className="flex flex-wrap items-start gap-2">
                <select
                  value={q.level}
                  onChange={(e) =>
                    updateQualification(index, { level: e.target.value as QualificationLevel })
                  }
                  className={`${formSelectClass} w-32 shrink-0`}
                >
                  {QUALIFICATION_LEVEL_OPTIONS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={q.degree}
                  onChange={(e) => updateQualification(index, { degree: e.target.value })}
                  className={`${formInputClass} min-w-0 flex-1`}
                  placeholder="e.g. BAMS, MD, PhD, DNYS"
                />
                {form.qualifications.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeQualification(index)}
                    className="rounded p-2 text-ink-ghost hover:text-danger"
                    aria-label="Remove qualification"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          {errors.qualifications ? (
            <p className="mt-1 text-xs text-danger">{errors.qualifications}</p>
          ) : (
            <p className="mt-1 text-[11px] text-ink-ghost">
              UG (BAMS), PG (MD), Doctorate (PhD), Diploma, Certificate — add all that apply
            </p>
          )}
        </div>

      </div>
    </Modal>
  );
};
