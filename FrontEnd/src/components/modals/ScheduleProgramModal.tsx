import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { NumericInput } from '@/components/ui/NumericInput';
import { formInputClass, formLabelClass, formSelectClass } from '@/components/ui/formStyles';
import type {
  ScheduleProgramFormValues,
  TherapistOnDuty,
  TreatmentRoom,
} from '@/types/panchakarma.types';

type PatientOption = { id: string; name: string };

interface Props {
  open: boolean;
  initial: ScheduleProgramFormValues;
  patients: PatientOption[];
  therapists: TherapistOnDuty[];
  rooms?: TreatmentRoom[];
  lockedTherapist?: TherapistOnDuty | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: ScheduleProgramFormValues) => void | Promise<void>;
}

export const ScheduleProgramModal = ({
  open,
  initial,
  patients,
  therapists,
  lockedTherapist = null,
  submitting = false,
  onClose,
  onSubmit,
}: Props) => {
  const [form, setForm] = useState<ScheduleProgramFormValues>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof ScheduleProgramFormValues, string>>>({});

  useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  const validate = () => {
    const next: typeof errors = {};
    if (!form.patientId) next.patientId = 'Select a patient';
    if (!form.therapistId) next.therapistId = 'Select a therapist';
    if (!form.startDate) next.startDate = 'Start date is required';
    if (!form.totalDays || form.totalDays < 1) {
      next.totalDays = 'Enter at least 1 day';
    } else if (form.totalDays > 30) {
      next.totalDays = 'Maximum 30 days';
    }
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
      subtitle="Patient, duration, therapist, and start date"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Program'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={formLabelClass}>Patient name *</label>
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
          <label className={formLabelClass}>Number of days *</label>
          <NumericInput
            value={form.totalDays}
            onChange={(v) => set('totalDays', v)}
            min={1}
            max={30}
            className={errors.totalDays ? 'border-danger' : ''}
            aria-label="Number of days"
          />
          {errors.totalDays ? (
            <p className="mt-1 text-xs text-danger">{errors.totalDays}</p>
          ) : (
            <p className="mt-1 text-xs text-ink-ghost">1–30 days</p>
          )}
        </div>

        <div>
          <label className={formLabelClass}>Therapist name *</label>
          {lockedTherapist ? (
            <div className="rounded-xl border border-border-sage bg-cream/40 px-3 py-2.5 text-sm font-medium text-ink">
              {lockedTherapist.name}
              {lockedTherapist.specialty ? (
                <span className="ml-1 font-normal text-ink-soft">
                  — {lockedTherapist.specialty}
                </span>
              ) : null}
            </div>
          ) : (
            <select
              value={form.therapistId}
              onChange={(e) => set('therapistId', e.target.value)}
              className={`${formSelectClass} ${errors.therapistId ? 'border-danger' : ''}`}
            >
              <option value="">Select therapist</option>
              {therapists.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.specialty}
                </option>
              ))}
            </select>
          )}
          {errors.therapistId ? (
            <p className="mt-1 text-xs text-danger">{errors.therapistId}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <label className={formLabelClass}>Start date *</label>
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
