import { useEffect, useState } from 'react';
import { Banknote, Landmark, QrCode, ShieldCheck, type LucideIcon } from 'lucide-react';
import type { PaymentMethodStat, PaymentMethodIcon } from '@/types/billing.types';

interface Props {
  methods: PaymentMethodStat[];
  className?: string;
}

const ICON_MAP: Record<PaymentMethodIcon, LucideIcon> = {
  upi: QrCode,
  bank: Landmark,
  cash: Banknote,
  insurance: ShieldCheck,
};

export const PaymentMethodsPanel = ({ methods, className = '' }: Props) => (
  <div className={`rounded-xl border border-border-sage bg-white ${className}`}>
    <div className="border-b border-border-sage px-4 py-2.5">
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
        Payment Methods
      </h3>
    </div>
    <div className="space-y-4 p-4">
      {methods.length === 0 ? (
        <p className="text-xs text-ink-soft">No paid invoices yet</p>
      ) : (
        methods.map((m) => <MethodBar key={m.id} method={m} />)
      )}
    </div>
  </div>
);

const MethodBar = ({ method }: { method: PaymentMethodStat }) => {
  const [width, setWidth] = useState(0);
  const Icon = ICON_MAP[method.icon];

  useEffect(() => {
    setWidth(0);
    const frame = requestAnimationFrame(() => setWidth(method.percent));
    return () => cancelAnimationFrame(frame);
  }, [method.percent]);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${method.iconClass}`}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
          <span className="truncate text-sm text-ink-soft">{method.label}</span>
        </div>
        <span className="shrink-0 text-sm font-semibold text-ink">{method.percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-sage-mist">
        <div
          className="h-full rounded-full bg-sage-deep transition-[width] duration-1000 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
};
