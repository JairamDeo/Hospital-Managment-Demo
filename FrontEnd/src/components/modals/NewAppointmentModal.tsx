import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formInputClass, formLabelClass, formSelectClass } from '@/components/ui/formStyles';
import { appointmentAdminService } from '@/services/appointment/appointmentAdmin.service';
import type { Patient } from '@/types/patient.types';
import type { AppointmentDoctor, AppointmentFormValues } from '@/types/appointment.types';
import { CONSULTATION_MODE_OPTIONS } from '@/types/appointment.types';
import { formatTimeLabel, isSlotPastForDate, localDateIso } from '@/utils/appointmentHelpers';
import { masterService } from '@/services/master/master.service';

interface Props {
  open: boolean;
  initial: AppointmentFormValues;
  patients: Patient[];
  doctors: AppointmentDoctor[];
  lockedDoctor?: AppointmentDoctor | null;
  submitting?: boolean;
  title?: string;
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
  title = 'New Appointment',
  onClose,
  onSubmit,
}: Props) => {
  const [form, setForm] = useState<AppointmentFormValues>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof AppointmentFormValues, string>>>({});
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [pastSlots, setPastSlots] = useState<string[]>([]);
  const [apiAvailableSlots, setApiAvailableSlots] = useState<string[] | null>(null);
  const [slotStats, setSlotStats] = useState<
    Array<{ time: string; booked: number; maxAppointments: number; remaining: number }>
  >([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [allSlots, setAllSlots] = useState<Array<{ time: string; label: string }>>([]);

  useEffect(() => {
    if (open) {
      const minDate = localDateIso();
      setForm({
        ...initial,
        date: initial.date && initial.date < minDate ? minDate : initial.date,
      });
      setErrors({});
      masterService
        .listAppointmentSlots(true)
        .then((res) =>
          setAllSlots(
            (res.data.res?.items ?? []).map((i) => ({
              time: i.time,
              label:
                i.label ||
                (i.endTime ? `${i.time} – ${i.endTime}` : formatTimeLabel(i.time)),
            }))
          )
        )
        .catch(() => setAllSlots([]));
    }
  }, [open, initial]);

  useEffect(() => {
    if (!open || !form.staffCode || !form.date) {
      setBookedSlots([]);
      setPastSlots([]);
      setApiAvailableSlots(null);
      return;
    }

    let cancelled = false;
    setLoadingSlots(true);
    appointmentAdminService
      .getAvailability(form.staffCode, form.date)
      .then((res) => {
        if (!cancelled) {
          const availability = res.data.res?.availability;
          setBookedSlots(availability?.bookedSlots ?? []);
          setPastSlots(availability?.pastSlots ?? []);
          setApiAvailableSlots(availability?.availableSlots ?? null);
          setSlotStats(availability?.slotStats ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBookedSlots([]);
          setPastSlots([]);
          setApiAvailableSlots(null);
          setSlotStats([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, form.staffCode, form.date]);

  const availableSlots = useMemo(
    () =>
      allSlots.filter((slot) => {
        if (bookedSlots.includes(slot.time) || pastSlots.includes(slot.time)) return false;
        if (isSlotPastForDate(form.date, slot.time)) return false;
        if (apiAvailableSlots) return apiAvailableSlots.includes(slot.time);
        return true;
      }),
    [allSlots, bookedSlots, pastSlots, apiAvailableSlots, form.date]
  );

  useEffect(() => {
    if (!form.time || availableSlots.some((s) => s.time === form.time)) return;
    setForm((f) => ({ ...f, time: availableSlots[0]?.time ?? '' }));
  }, [availableSlots, form.time]);

  const today = useMemo(() => localDateIso(), [open]);

  const validate = () => {
    const next: typeof errors = {};
    if (!form.patientId) next.patientId = 'Select a patient';
    if (!form.staffCode) next.staffCode = 'Select a doctor';
    if (!form.date) next.date = 'Date is required';
    else if (form.date < today) next.date = 'Cannot book for a past date';
    if (!form.time) next.time = 'Time is required';
    else if (isSlotPastForDate(form.date, form.time)) {
      next.time = 'This time slot has already passed';
    }
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

  const isReschedule = /reschedule/i.test(title);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={
        lockedDoctor
          ? `Schedule a visit for ${lockedDoctor.name}`
          : 'Schedule a patient visit · default Offline'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loadingSlots}>
            {submitting
              ? isReschedule
                ? 'Rescheduling…'
                : 'Scheduling…'
              : isReschedule
                ? 'Reschedule'
                : 'Create Appointment'}
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
            min={today}
            onChange={(e) => set('date', e.target.value)}
            className={`${formInputClass} ${errors.date ? 'border-danger' : ''}`}
          />
          {errors.date ? <p className="mt-1 text-xs text-danger">{errors.date}</p> : null}
        </div>

        <div>
          <label className={formLabelClass}>Mode *</label>
          <select
            value={form.consultationMode}
            onChange={(e) =>
              set('consultationMode', e.target.value as AppointmentFormValues['consultationMode'])
            }
            className={formSelectClass}
          >
            {CONSULTATION_MODE_OPTIONS.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
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
              availableSlots.map((slot) => {
                const stat = slotStats.find((s) => s.time === slot.time);
                const capacity =
                  stat && stat.maxAppointments > 1
                    ? ` (${stat.remaining}/${stat.maxAppointments} left)`
                    : '';
                return (
                  <option key={slot.time} value={slot.time}>
                    {slot.label}
                    {capacity}
                  </option>
                );
              })
            )}
          </select>
          {errors.time ? <p className="mt-1 text-xs text-danger">{errors.time}</p> : null}
          {form.staffCode && form.date && bookedSlots.length > 0 ? (
            <p className="mt-1 text-xs text-ink-ghost">
              {bookedSlots.length} slot{bookedSlots.length === 1 ? '' : 's'} at full capacity for this
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
