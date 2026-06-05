import { Percent, Receipt, Scale, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { InvoiceDetail } from '@/types/billing.types';
import { formatRupee } from '@/types/billing.types';

interface Props {
  invoice: InvoiceDetail;
}

const METRICS: {
  label: string;
  icon: LucideIcon;
  tone: string;
  value: (inv: InvoiceDetail) => string;
}[] = [
  {
    label: 'Subtotal',
    icon: Receipt,
    tone: 'text-blue-600 bg-blue-50',
    value: (inv) => formatRupee(inv.subtotal),
  },
  {
    label: 'Tax',
    icon: Percent,
    tone: 'text-orange-600 bg-orange-50',
    value: (inv) => formatRupee(inv.tax),
  },
  {
    label: 'Discount',
    icon: Scale,
    tone: 'text-violet-600 bg-violet-50',
    value: (inv) => (inv.discount > 0 ? `−${formatRupee(inv.discount)}` : '—'),
  },
  {
    label: 'Balance',
    icon: Wallet,
    tone: 'text-emerald-600 bg-emerald-50',
    value: (inv) => formatRupee(inv.balance),
  },
];

export const InvoiceAmountRow = ({ invoice }: Props) => (
  <div className="grid grid-cols-4 gap-2 sm:gap-3">
    {METRICS.map(({ label, icon: Icon, tone, value }) => (
      <div
        key={label}
        className="min-w-0 rounded-2xl border border-border-sage bg-white px-2.5 py-3 shadow-sm sm:px-4"
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg sm:h-7 sm:w-7 ${tone}`}>
            <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.25} />
          </span>
          <span className="truncate text-[9px] font-bold uppercase tracking-wider text-ink-ghost sm:text-[10px]">
            {label}
          </span>
        </div>
        <p className="mt-1.5 truncate text-sm font-semibold text-ink sm:mt-2 sm:text-base">
          {value(invoice)}
        </p>
      </div>
    ))}
  </div>
);
