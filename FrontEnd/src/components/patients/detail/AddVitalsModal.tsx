import { useState } from 'react';
import { Activity } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formInputClass, formLabelClass } from '@/components/ui/formStyles';
import type { PatientVitalsPayload } from '@/types/patientVitals.types';

interface Props {
  open: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: PatientVitalsPayload) => void | Promise<void>;
}

const emptyForm = (): PatientVitalsPayload => ({
  bp: '',
  pulse: '',
  spo2: '',
  fasting: '',
  postMeal: '',
  random: '',
  weight: '',
});

export const AddVitalsModal = ({ open, submitting = false, onClose, onSubmit }: Props) => {
  const [form, setForm] = useState(emptyForm);

  const set = (key: keyof PatientVitalsPayload, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = () => {
    const hasValue = Object.values(form).some((v) => v?.trim());
    if (!hasValue) return;
    void onSubmit(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record vitals"
      subtitle="Blood pressure, pulse, SpO₂, glucose, and weight"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : 'Save vitals'}
          </Button>
        </>
      }
    >
      <div className="mb-3 flex items-center gap-2 rounded-lg bg-sage-mist/40 px-3 py-2 text-sm text-ink-soft">
        <Activity className="h-4 w-4 text-sage-deep" />
        Latest reading updates the patient sidebar vitals
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className={formLabelClass}>Blood pressure</span>
          <input
            type="text"
            value={form.bp}
            onChange={(e) => set('bp', e.target.value)}
            placeholder="120/80"
            className={formInputClass}
          />
        </label>
        <label>
          <span className={formLabelClass}>Pulse (bpm)</span>
          <input
            type="text"
            value={form.pulse}
            onChange={(e) => set('pulse', e.target.value)}
            placeholder="72"
            className={formInputClass}
          />
        </label>
        <label>
          <span className={formLabelClass}>SpO₂ (%)</span>
          <input
            type="text"
            value={form.spo2}
            onChange={(e) => set('spo2', e.target.value)}
            placeholder="98"
            className={formInputClass}
          />
        </label>
        <label>
          <span className={formLabelClass}>Weight (kg)</span>
          <input
            type="text"
            value={form.weight}
            onChange={(e) => set('weight', e.target.value)}
            placeholder="68"
            className={formInputClass}
          />
        </label>
        <label>
          <span className={formLabelClass}>Fasting glucose</span>
          <input
            type="text"
            value={form.fasting}
            onChange={(e) => set('fasting', e.target.value)}
            className={formInputClass}
          />
        </label>
        <label>
          <span className={formLabelClass}>Post-meal glucose</span>
          <input
            type="text"
            value={form.postMeal}
            onChange={(e) => set('postMeal', e.target.value)}
            className={formInputClass}
          />
        </label>
        <label className="sm:col-span-2">
          <span className={formLabelClass}>Random glucose</span>
          <input
            type="text"
            value={form.random}
            onChange={(e) => set('random', e.target.value)}
            className={formInputClass}
          />
        </label>
      </div>
    </Modal>
  );
};
