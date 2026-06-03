import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formInputClass, formLabelClass, formSelectClass } from '@/components/ui/formStyles';
import type { Patient } from '@/types/patient.types';
import {
  MOCK_THERAPISTS,
  PROGRAM_DAY_OPTIONS,
  ROOM_OPTIONS,
  THERAPY_OPTIONS,
  type ScheduleProgramFormValues,
} from '@/pages/panchakarma/data/mockPanchakarma';

interface Props {
  open: boolean;
  initial: ScheduleProgramFormValues;
  patients: Patient[];
  onClose: () => void;
  onSubmit: (values: ScheduleProgramFormValues) => void;
}

export const ScheduleProgramModal = ({ open, initial, patients, onClose, onSubmit }: Props) => {
  const [form, setForm] = useState<ScheduleProgramFormValues>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof ScheduleProgramFormValues, string>>>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!form.patientId) next.patientId = 'Select a patient';
    if (!form.therapistId) next.therapistId = 'Select a therapist';
    if (!form.room) next.room = 'Select a room';
    if (!form.startDate) next.startDate = 'Start date is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(form);
  };

  const set = <K extends keyof ScheduleProgramFormValues>(
    key: K,
    value: ScheduleProgramFormValues[K]
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule Program"
      subtitle="Assign a new Panchakarma therapy program"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create Program</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={formLabelClass}>Patient *</label>
          <select
            value={form.patientId}
            onChange={(e) => set('patientId', e.target.value)}
            className={`${formSelectClass} ${errors.patientId ? 'border-danger' : ''}`}
          >
            <option value="">Select patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id})
              </option>
            ))}
          </select>
          {errors.patientId ? (
            <p className="mt-1 text-xs text-danger">{errors.patientId}</p>
          ) : null}
        </div>

        <div>
          <label className={formLabelClass}>Therapy *</label>
          <select
            value={form.therapy}
            onChange={(e) => set('therapy', e.target.value as ScheduleProgramFormValues['therapy'])}
            className={formSelectClass}
          >
            {THERAPY_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={formLabelClass}>Duration (Days) *</label>
          <select
            value={form.totalDays}
            onChange={(e) => set('totalDays', parseInt(e.target.value, 10))}
            className={formSelectClass}
          >
            {PROGRAM_DAY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d} days
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={formLabelClass}>Room *</label>
          <select
            value={form.room}
            onChange={(e) => set('room', e.target.value)}
            className={`${formSelectClass} ${errors.room ? 'border-danger' : ''}`}
          >
            {ROOM_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {errors.room ? <p className="mt-1 text-xs text-danger">{errors.room}</p> : null}
        </div>

        <div>
          <label className={formLabelClass}>Therapist *</label>
          <select
            value={form.therapistId}
            onChange={(e) => set('therapistId', e.target.value)}
            className={`${formSelectClass} ${errors.therapistId ? 'border-danger' : ''}`}
          >
            <option value="">Select therapist</option>
            {MOCK_THERAPISTS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.specialty}
              </option>
            ))}
          </select>
          {errors.therapistId ? (
            <p className="mt-1 text-xs text-danger">{errors.therapistId}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <label className={formLabelClass}>Start Date *</label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => set('startDate', e.target.value)}
            className={`${formInputClass} ${errors.startDate ? 'border-danger' : ''}`}
          />
          {errors.startDate ? (
            <p className="mt-1 text-xs text-danger">{errors.startDate}</p>
          ) : null}
        </div>
      </div>
    </Modal>
  );
};
