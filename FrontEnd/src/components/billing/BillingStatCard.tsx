import { Banknote, CheckCircle2, Clock, TriangleAlert } from 'lucide-react';

interface Props {
  label: string;
  value: string;
  subLabel: string;
  icon: typeof Banknote;
  iconClass: string;
  subClass?: string;
}

export const BillingStatCard = ({
  label,
  value,
  subLabel,
  icon: Icon,
  iconClass,
  subClass = 'text-success',
}: Props) => (
  <div className="rounded-xl border border-border-sage bg-white p-3.5">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">{label}</p>
        <p className="mt-1 text-2xl font-bold leading-none text-ink">{value}</p>
        <p className={`mt-1 text-[11px] font-medium ${subClass}`}>{subLabel}</p>
      </div>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </div>
    </div>
  </div>
);

export const billingStatCards = [
  {
    label: 'Total Revenue',
    value: '₹4.8L',
    subLabel: '+12% this month',
    icon: Banknote,
    iconClass: 'bg-success-bg text-success',
    subClass: 'text-success',
  },
  {
    label: 'Collected',
    value: '₹3.9L',
    subLabel: '82% collection rate',
    icon: CheckCircle2,
    iconClass: 'bg-success-bg text-success',
    subClass: 'text-ink-soft',
  },
  {
    label: 'Pending',
    value: '₹64K',
    subLabel: '18 invoices due',
    icon: Clock,
    iconClass: 'bg-warning-bg text-warning',
    subClass: 'text-warning',
  },
  {
    label: 'Overdue',
    value: '₹12K',
    subLabel: '4 overdue bills',
    icon: TriangleAlert,
    iconClass: 'bg-danger-bg text-danger',
    subClass: 'text-danger',
  },
];
