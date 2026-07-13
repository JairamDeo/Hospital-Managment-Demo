import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import {
  payAppointmentWithRazorpay,
} from '@/services/appointment/patientPortalAppointment.service';
import type { HmsAppointment } from '@/types/api.types';
import { getApiErrorMessage } from '@/utils/helpers';

interface Props {
  appointment: HmsAppointment;
  patientName: string;
  onPaid?: (appointment: HmsAppointment) => void;
  compact?: boolean;
}

const formatRupee = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

export const AppointmentPayButton = ({
  appointment,
  patientName,
  onPaid,
  compact = false,
}: Props) => {
  const { showToast } = useToast();
  const [paying, setPaying] = useState(false);

  if (appointment.status === 'Cancelled') return null;

  if (appointment.paymentStatus === 'paid') {
    return (
      <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
        Paid
      </span>
    );
  }

  if (appointment.paymentStatus !== 'unpaid') return null;

  const fee = appointment.consultationFeeExpected ?? 0;

  const handlePay = async () => {
    setPaying(true);
    try {
      await payAppointmentWithRazorpay(appointment.appointmentCode, patientName, (updated) => {
        showToast('Payment successful. Your appointment is confirmed.', 'success');
        onPaid?.(updated);
      });
    } catch (err) {
      const message = getApiErrorMessage(err);
      if (message !== 'Could not load Razorpay checkout') {
        showToast(message, 'error');
      }
    } finally {
      setPaying(false);
    }
  };

  if (compact) {
    return (
      <Button
        type="button"
        variant="secondary"
        className="shrink-0 px-3 py-1.5 text-xs"
        onClick={() => void handlePay()}
        disabled={paying}
      >
        {paying ? 'Paying…' : `Pay ${formatRupee(fee)}`}
      </Button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-sage-pale bg-sage-mist/40 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-ink-soft">Consultation fee</p>
          <p className="text-sm font-semibold text-ink">{formatRupee(fee)}</p>
        </div>
        <Button type="button" onClick={() => void handlePay()} disabled={paying}>
          <CreditCard className="mr-1.5 h-4 w-4" />
          {paying ? 'Opening payment…' : 'Pay now'}
        </Button>
      </div>
    </div>
  );
};
