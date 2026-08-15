import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formInputClass, formLabelClass, formSelectClass } from '@/components/ui/formStyles';
import { appointmentAdminService } from '@/services/appointment/appointmentAdmin.service';
import type { Patient } from '@/types/patient.types';
import type { AppointmentDoctor, AppointmentFormValues } from '@/types/appointment.types';
import { TIME_SLOTS } from '@/types/appointment.types';
import { formatTimeLabel } from '@/utils/appointmentHelpers';

interface Props {
  open: boolean;
  initial: AppointmentFormValues;
  patients: Patient[];
  doctors: AppointmentDoctor[];
  lockedDoctor?: AppointmentDoctor | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: AppointmentFormValues) => void | Promise<void>;
}

export const NewAppointmentModal = ({
  open,
  initial,
  patients,
  doctors,
  lockedDoctor = null,
  submitting = false,
  onClose,
  onSubmit,
}: Props) => {
  const [form, setForm] = useState<AppointmentFormValues>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof AppointmentFormValues, string>>>({});
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  useEffect(() => {
    if (!open || !form.staffCode || !form.date) {
      setBookedSlots([]);
      return;
    }

    let cancelled = false;
    setLoadingSlots(true);
    appointmentAdminService
      .getAvailability(form.staffCode, form.date)
      .then((res) => {
        if (!cancelled) setBookedSlots(res.data.res?.availability.bookedSlots ?? []);
      })
      .catch(() => {
        if (!cancelled) setBookedSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, form.staffCode, form.date]);

  const availableSlots = useMemo(
    () => TIME_SLOTS.filter((slot) => !bookedSlots.includes(slot)),
    [bookedSlots]
  );

  useEffect(() => {
    if (!form.time || availableSlots.includes(form.time)) return;
    setForm((f) => ({ ...f, time: availableSlots[0] ?? '' }));
  }, [availableSlots, form.time]);

  const validate = () => {
    const next: typeof errors = {};
    if (!form.patientId) next.patientId = 'Select a patient';
    if (!form.staffCode) next.staffCode = 'Select a doctor';
    if (!form.date) next.date = 'Date is required';
    if (!form.time) next.time = 'Time is required';
    if (form.time && bookedSlots.includes(form.time)) {
      next.time = 'This slot is already booked for the selected doctor';
    }
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
      subtitle={
        lockedDoctor
          ? `Schedule a visit for ${lockedDoctor.name}`
          : 'Schedule a patient visit'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loadingSlots}>
            {submitting ? 'Scheduling…' : 'Create Appointment'}
          </Button>
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

        <div className="sm:col-span-2">
          <label className={formLabelClass}>Doctor *</label>
          {lockedDoctor ? (
            <div className="rounded-xl border border-border-sage bg-cream/40 px-3 py-2.5 text-sm font-medium text-ink">
              {lockedDoctor.name}
              {lockedDoctor.title ? (
                <span className="ml-1 font-normal text-ink-soft">— {lockedDoctor.title}</span>
              ) : null}
            </div>
          ) : (
            <select
              value={form.staffCode}
              onChange={(e) => set('staffCode', e.target.value)}
              className={`${formSelectClass} ${errors.staffCode ? 'border-danger' : ''}`}
            >
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d.staffCode} value={d.staffCode}>
                  {d.name} — {d.title}
                </option>
              ))}
            </select>
          )}
          {errors.staffCode ? (
            <p className="mt-1 text-xs text-danger">{errors.staffCode}</p>
          ) : null}
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
            disabled={!form.staffCode || !form.date || loadingSlots}
            className={`${formSelectClass} ${errors.time ? 'border-danger' : ''}`}
          >
            {!form.staffCode || !form.date ? (
              <option value="">Select doctor and date first</option>
            ) : loadingSlots ? (
              <option value="">Loading slots…</option>
            ) : availableSlots.length === 0 ? (
              <option value="">No slots available</option>
            ) : (
              availableSlots.map((t) => (
                <option key={t} value={t}>
                  {formatTimeLabel(t)}
                </option>
              ))
            )}
          </select>
          {errors.time ? <p className="mt-1 text-xs text-danger">{errors.time}</p> : null}
          {form.staffCode && form.date && bookedSlots.length > 0 ? (
            <p className="mt-1 text-xs text-ink-ghost">
              {bookedSlots.length} slot{bookedSlots.length === 1 ? '' : 's'} already booked for this
              doctor
            </p>
          ) : null}
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
