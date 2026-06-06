import { Banknote } from 'lucide-react';

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
