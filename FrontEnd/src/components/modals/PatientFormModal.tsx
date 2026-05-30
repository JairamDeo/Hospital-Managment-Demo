import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formInputClass, formLabelClass, formSelectClass } from '@/components/ui/formStyles';
import type { PatientFormValues } from '@/pages/patients/data/mockPatients';
import {
  PRAKRITI_OPTIONS,
  STATUS_OPTIONS,
  TREATMENT_OPTIONS,
} from '@/utils/patientHelpers';

interface Props {
  open: boolean;
  mode: 'add' | 'edit';
  initial: PatientFormValues;
  patientId?: string;
  onClose: () => void;
  onSubmit: (values: PatientFormValues) => void;
}

export const PatientFormModal = ({
  open,
  mode,
  initial,
  patientId,
  onClose,
  onSubmit,
}: Props) => {
  const [form, setForm] = useState<PatientFormValues>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof PatientFormValues, string>>>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (form.age < 1 || form.age > 120) next.age = 'Enter a valid age';
    if (!form.treatment.trim()) next.treatment = 'Treatment is required';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) next.email = 'Invalid email';
    if (form.mobile && !/^[0-9]{10}$/.test(form.mobile.replace(/\D/g, '')))
      next.mobile = 'Enter 10-digit mobile';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      ...form,
      mobile: form.mobile.replace(/\D/g, '').slice(0, 10),
    });
  };

  const set = <K extends keyof PatientFormValues>(key: K, value: PatientFormValues[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'add' ? 'Add New Patient' : 'Edit Patient'}
      subtitle={
        mode === 'add'
          ? 'Patient ID will be generated automatically'
          : `Updating record #${patientId}`
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {mode === 'add' ? 'Add Patient' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {mode === 'edit' && patientId ? (
          <div className="sm:col-span-2">
            <label className={formLabelClass}>Patient ID</label>
            <input type="text" value={patientId} disabled className={formInputClass} />
          </div>
        ) : null}

        <div className="sm:col-span-2">
          <label className={formLabelClass}>Full Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className={`${formInputClass} ${errors.name ? 'border-danger' : ''}`}
            placeholder="Patient full name"
          />
          {errors.name ? <p className="mt-1 text-xs text-danger">{errors.name}</p> : null}
        </div>

        <div>
          <label className={formLabelClass}>Prakriti *</label>
          <select
            value={form.prakriti}
            onChange={(e) => set('prakriti', e.target.value as PatientFormValues['prakriti'])}
            className={formSelectClass}
          >
            {PRAKRITI_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={formLabelClass}>Age *</label>
          <input
            type="number"
            min={1}
            max={120}
            value={form.age}
            onChange={(e) => set('age', parseInt(e.target.value, 10) || 0)}
            className={`${formInputClass} ${errors.age ? 'border-danger' : ''}`}
          />
          {errors.age ? <p className="mt-1 text-xs text-danger">{errors.age}</p> : null}
        </div>

        <div>
          <label className={formLabelClass}>Last Visit</label>
          <input
            type="date"
            value={form.lastVisit}
            onChange={(e) => set('lastVisit', e.target.value)}
            className={formInputClass}
          />
        </div>

        <div>
          <label className={formLabelClass}>Status *</label>
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value as PatientFormValues['status'])}
            className={formSelectClass}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={formLabelClass}>Treatment *</label>
          <select
            value={form.treatment}
            onChange={(e) => set('treatment', e.target.value)}
            className={formSelectClass}
          >
            {TREATMENT_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={formLabelClass}>Mobile</label>
          <input
            type="tel"
            value={form.mobile}
            onChange={(e) => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
            className={`${formInputClass} ${errors.mobile ? 'border-danger' : ''}`}
            placeholder="10-digit number"
          />
          {errors.mobile ? <p className="mt-1 text-xs text-danger">{errors.mobile}</p> : null}
        </div>

        <div>
          <label className={formLabelClass}>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            className={`${formInputClass} ${errors.email ? 'border-danger' : ''}`}
            placeholder="email@example.com"
          />
          {errors.email ? <p className="mt-1 text-xs text-danger">{errors.email}</p> : null}
        </div>
      </div>
    </Modal>
  );
};
