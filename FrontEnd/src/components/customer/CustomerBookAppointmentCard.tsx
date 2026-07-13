import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formInputClass, formLabelClass, formSelectClass } from '@/components/ui/formStyles';
import { AppointmentPayButton } from '@/components/customer/AppointmentPayButton';
import { usePatientPortalAuth } from '@/hooks/usePatientPortalAuth';
import { useToast } from '@/hooks/useToast';
import {
  payAppointmentWithRazorpay,
  patientPortalAppointmentService,
} from '@/services/appointment/patientPortalAppointment.service';
import { getApiErrorMessage } from '@/utils/helpers';
import {
  TIME_SLOTS,
  type AppointmentDoctor,
} from '@/types/appointment.types';
import type { HmsAppointment } from '@/types/api.types';
import { formatTimeLabel } from '@/utils/appointmentHelpers';

interface Props {
  onBooked?: () => void;
}

export const CustomerBookAppointmentCard = ({ onBooked }: Props) => {
  const { showToast } = useToast();
  const { patient } = usePatientPortalAuth();
  const [doctors, setDoctors] = useState<AppointmentDoctor[]>([]);
  const [staffCode, setStaffCode] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [timeSlot, setTimeSlot] = useState('10:30');
  const [notes, setNotes] = useState('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastBooked, setLastBooked] = useState<HmsAppointment | null>(null);
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);

  const loadDoctorsAndMine = async () => {
    try {
      const [doctorsRes, configRes] = await Promise.all([
        patientPortalAppointmentService.listDoctors(),
        patientPortalAppointmentService.getRazorpayConfig().catch(() => null),
      ]);
      setDoctors(doctorsRes.data.res?.doctors ?? []);
      setRazorpayEnabled(Boolean(configRes?.data.res?.razorpay?.enabled));
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  useEffect(() => {
    void loadDoctorsAndMine();
  }, []);

  useEffect(() => {
    if (!staffCode || !date) {
      setBookedSlots([]);
      return;
    }

    let cancelled = false;
    setLoadingSlots(true);
    patientPortalAppointmentService
      .getAvailability(staffCode, date)
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
  }, [staffCode, date]);

  const availableSlots = useMemo(
    () => TIME_SLOTS.filter((slot) => !bookedSlots.includes(slot)),
    [bookedSlots]
  );

  useEffect(() => {
    if (!timeSlot || availableSlots.includes(timeSlot)) return;
    setTimeSlot(availableSlots[0] ?? '');
  }, [availableSlots, timeSlot]);

  const selectedDoctor = doctors.find((d) => d.staffCode === staffCode);
  const consultationFee = selectedDoctor?.consultationFee ?? 0;

  const handleBook = async (payNow = false) => {
    if (!staffCode) {
      showToast('Please select a doctor', 'error');
      return;
    }
    if (!date || !timeSlot) {
      showToast('Please select date and time', 'error');
      return;
    }
    if (bookedSlots.includes(timeSlot)) {
      showToast(
        selectedDoctor
          ? `${selectedDoctor.name} already has an appointment at this time. Please choose another slot.`
          : 'This time slot is no longer available. Please choose another slot.',
        'error'
      );
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await patientPortalAppointmentService.book({
        staffCode,
        date,
        timeSlot,
        notes: notes.trim() || undefined,
      });
      if (data.status_code === 201) {
        const appointment = data.res?.appointment;
        if (appointment) {
          setLastBooked(appointment);
        }
        showToast('Your appointment has been scheduled successfully', 'success');
        setNotes('');
        await loadDoctorsAndMine();
        onBooked?.();

        if (
          payNow &&
          appointment?.paymentStatus === 'unpaid' &&
          razorpayEnabled &&
          patient?.name
        ) {
          try {
            await payAppointmentWithRazorpay(appointment.appointmentCode, patient.name, (updated) => {
              setLastBooked(updated);
              onBooked?.();
              showToast('Payment successful. Your visit fee is paid.', 'success');
            });
          } catch (payErr) {
            showToast(getApiErrorMessage(payErr), 'error');
          }
        }
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
      <div className="rounded-2xl border border-border-sage bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <CalendarPlus className="h-5 w-5 text-sage-deep" strokeWidth={1.75} />
          <h2 className="font-serif text-lg font-semibold text-ink">Book an appointment</h2>
        </div>

        <div className="grid gap-4">
          <div>
            <label className={formLabelClass}>Doctor *</label>
            <select
              value={staffCode}
              onChange={(e) => setStaffCode(e.target.value)}
              className={formSelectClass}
            >
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d.staffCode} value={d.staffCode}>
                  {d.name} — {d.title}
                  {(d.consultationFee ?? 0) > 0 ? ` · ₹${d.consultationFee}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={formLabelClass}>Date *</label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
                className={formInputClass}
              />
            </div>
            <div>
              <label className={formLabelClass}>Time *</label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                disabled={!staffCode || !date || loadingSlots}
                className={formSelectClass}
              >
                {!staffCode || !date ? (
                  <option value="">Select doctor & date</option>
                ) : loadingSlots ? (
                  <option value="">Loading…</option>
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
            </div>
          </div>

          <div>
            <label className={formLabelClass}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes for your visit"
              className={`${formInputClass} resize-none`}
            />
          </div>

          {selectedDoctor && consultationFee > 0 ? (
            <p className="text-sm text-ink-soft">
              Consultation fee:{' '}
              <span className="font-semibold text-ink">₹{consultationFee}</span>
              {razorpayEnabled ? ' — pay online after booking' : ''}
            </p>
          ) : null}

          {lastBooked?.paymentStatus === 'unpaid' ? (
            <AppointmentPayButton
              appointment={lastBooked}
              patientName={patient?.name || lastBooked.patientName}
              onPaid={(updated) => {
                setLastBooked(updated);
                onBooked?.();
              }}
            />
          ) : null}

          <div className={consultationFee > 0 && razorpayEnabled ? 'grid gap-2 sm:grid-cols-2' : ''}>
            {consultationFee > 0 && razorpayEnabled ? (
              <>
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => void handleBook(false)}
                  disabled={submitting || loadingSlots || !staffCode || !timeSlot}
                >
                  {submitting ? 'Booking…' : 'Book only'}
                </Button>
                <Button
                  className="w-full"
                  onClick={() => void handleBook(true)}
                  disabled={submitting || loadingSlots || !staffCode || !timeSlot}
                >
                  {submitting ? 'Booking…' : 'Book & pay now'}
                </Button>
              </>
            ) : (
              <Button
                className="w-full"
                onClick={() => void handleBook(false)}
                disabled={submitting || loadingSlots || !staffCode || !timeSlot}
              >
                {submitting ? 'Booking…' : 'Book appointment'}
              </Button>
            )}
          </div>
        </div>
      </div>
  );
};
