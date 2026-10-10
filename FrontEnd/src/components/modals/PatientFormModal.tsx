import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formInputClass, formLabelClass, formSelectClass } from '@/components/ui/formStyles';
import { FormSelect } from '@/components/ui/FormSelect';
import type { PatientFormValues } from '@/types/patient.types';
import {
  ADD_PATIENT_GENDER_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  STATUS_OPTIONS,
} from '@/utils/patientHelpers';
import type { MasterItem } from '@/types/api.types';

interface Props {
  open: boolean;
  mode: 'add' | 'edit';
  initial: PatientFormValues;
  patientId?: string;
  prakritiOptions?: MasterItem[];
  treatmentOptions?: MasterItem[];
  onClose: () => void;
  onSubmit: (values: PatientFormValues) => void;
}

export const PatientFormModal = ({
  open,
  mode,
  initial,
  patientId,
  prakritiOptions = [],
  treatmentOptions = [],
  onClose,
  onSubmit,
}: Props) => {
  const [form, setForm] = useState<PatientFormValues>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof PatientFormValues, string>>>({});

  useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  const validate = () => {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (form.age === '' || form.age < 1 || form.age > 120) next.age = 'Enter a valid age';
    if (mode === 'add' && !form.gender) next.gender = 'Gender is required';
    if (!/^[0-9]{10}$/.test(form.mobile.replace(/\D/g, '')))
      next.mobile = '10-digit mobile is required';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) next.email = 'Invalid email';
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
      subtitle={mode === 'edit' && patientId ? `Updating record #${patientId}` : undefined}
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
          <label className={formLabelClass}>Age *</label>
          <input
            type="number"
            min={1}
            max={120}
            value={form.age === '' ? '' : form.age}
            onChange={(e) => {
              const v = e.target.value;
              set('age', v === '' ? '' : parseInt(v, 10));
            }}
            className={`${formInputClass} ${errors.age ? 'border-danger' : ''}`}
            placeholder="Enter age"
          />
          {errors.age ? <p className="mt-1 text-xs text-danger">{errors.age}</p> : null}
        </div>

        <div>
          <label className={formLabelClass}>Gender *</label>
          <select
            value={form.gender}
            onChange={(e) => set('gender', e.target.value as PatientFormValues['gender'])}
            className={`${formSelectClass} ${errors.gender ? 'border-danger' : ''}`}
          >
            <option value="">Choose gender</option>
            {ADD_PATIENT_GENDER_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          {errors.gender ? <p className="mt-1 text-xs text-danger">{errors.gender}</p> : null}
        </div>

        <div>
          <label className={formLabelClass}>Blood Group</label>
          <select
            value={form.bloodGroup}
            onChange={(e) => set('bloodGroup', e.target.value)}
            className={formSelectClass}
          >
            <option value="">Choose blood group</option>
            {BLOOD_GROUP_OPTIONS.filter(Boolean).map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={formLabelClass}>Address</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            className={formInputClass}
            placeholder="Optional address"
          />
        </div>

        {mode === 'edit' ? (
          <>
            {prakritiOptions.length ? (
              <FormSelect
                label="Prakriti (optional)"
                value={form.prakritiId}
                onChange={(v) => set('prakritiId', v)}
                placeholder="Choose prakriti"
                options={prakritiOptions.map((o) => ({ value: o._id, label: o.name }))}
                error={errors.prakritiId}
                clearable
                clearLabel="Choose prakriti"
              />
            ) : null}
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
              <FormSelect
                label="Treatment"
                value={form.treatmentId}
                onChange={(v) => set('treatmentId', v)}
                placeholder="Select treatment (optional)"
                options={treatmentOptions.map((o) => ({ value: o._id, label: o.name }))}
                error={errors.treatmentId}
              />
            </div>
          </>
        ) : null}

        <div>
          <label className={formLabelClass}>Mobile *</label>
          <input
            type="tel"
            value={form.mobile}
            onChange={(e) => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
            className={`${formInputClass} ${errors.mobile ? 'border-danger' : ''}`}
            placeholder="10-digit number"
          />
          <p className="mt-1 text-xs text-ink-ghost">Must be unique — not used by another patient</p>
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
