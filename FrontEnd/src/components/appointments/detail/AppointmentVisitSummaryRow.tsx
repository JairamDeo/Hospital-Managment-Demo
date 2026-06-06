import { Clock, DoorOpen, IndianRupee, LogIn } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AppointmentDetail } from '@/types/appointmentDetail.types';

interface Props {
  appointment: AppointmentDetail;
}

const MetricCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-border-sage bg-white px-4 py-3 shadow-sm">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sage-mist text-sage-deep">
      <Icon className="h-4 w-4" strokeWidth={2} />
    </span>
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">{label}</p>
      <p className="truncate text-sm font-semibold text-ink">{value}</p>
    </div>
  </div>
);

const formatRupee = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    amount
  );

export const AppointmentVisitSummaryRow = ({ appointment }: Props) => (
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <MetricCard icon={Clock} label="Scheduled Time" value={appointment.formattedTime} />
    <MetricCard
      icon={LogIn}
      label="Check-in"
      value={appointment.checkInTime ?? 'Not checked in'}
    />
    <MetricCard icon={DoorOpen} label="Room" value={appointment.room} />
    <MetricCard
      icon={IndianRupee}
      label="Fee"
      value={`${formatRupee(appointment.fee ?? 0)} · ${appointment.paymentStatus}`}
    />
  </div>
);
