import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formInputClass, formLabelClass, formSelectClass } from '@/components/ui/formStyles';
import { MOCK_PATIENTS } from '@/pages/patients/data/mockPatients';
import {
  APPOINTMENT_TYPE_OPTIONS,
  TIME_SLOTS,
  type AppointmentFormValues,
} from '@/pages/appointments/data/mockAppointments';

interface Props {
  open: boolean;
  initial: AppointmentFormValues;
  onClose: () => void;
  onSubmit: (values: AppointmentFormValues) => void;
}

export const NewAppointmentModal = ({ open, initial, onClose, onSubmit }: Props) => {
  const [form, setForm] = useState<AppointmentFormValues>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof AppointmentFormValues, string>>>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!form.patientId) next.patientId = 'Select a patient';
    if (!form.date) next.date = 'Date is required';
    if (!form.time) next.time = 'Time is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(form);
  };

  const set = <K extends keyof AppointmentFormValues>(key: K, value: AppointmentFormValues[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Appointment"
      subtitle="Schedule a patient visit"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create Appointment</Button>
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
            {MOCK_PATIENTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id})
              </option>
            ))}
          </select>
          {errors.patientId ? (
            <p className="mt-1 text-xs text-danger">{errors.patientId}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <label className={formLabelClass}>Appointment Type *</label>
          <select
            value={form.type}
            onChange={(e) => set('type', e.target.value as AppointmentFormValues['type'])}
            className={formSelectClass}
          >
            {APPOINTMENT_TYPE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={formLabelClass}>Date *</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            className={`${formInputClass} ${errors.date ? 'border-danger' : ''}`}
          />
          {errors.date ? <p className="mt-1 text-xs text-danger">{errors.date}</p> : null}
        </div>

        <div>
          <label className={formLabelClass}>Time *</label>
          <select
            value={form.time}
            onChange={(e) => set('time', e.target.value)}
            className={`${formSelectClass} ${errors.time ? 'border-danger' : ''}`}
          >
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>
                {formatTimeLabel(t)}
              </option>
            ))}
          </select>
          {errors.time ? <p className="mt-1 text-xs text-danger">{errors.time}</p> : null}
        </div>

        <div className="sm:col-span-2">
          <label className={formLabelClass}>Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            placeholder="Optional notes for this appointment"
            className={`${formInputClass} resize-none`}
          />
        </div>
      </div>
    </Modal>
  );
};

const formatTimeLabel = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
};
