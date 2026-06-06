import { formatRupee } from '@/types/billing.types';

export interface InsuranceClaim {
  id: string;
  provider: string;
  claims: number;
  amount: number;
}

interface Props {
  claims: InsuranceClaim[];
  className?: string;
}

export const InsuranceClaimsPanel = ({ claims, className = '' }: Props) => (
  <div className={`rounded-xl border border-border-sage bg-white ${className}`}>
    <div className="border-b border-border-sage px-4 py-2.5">
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
        Insurance Claims
      </h3>
    </div>
    <div className="divide-y divide-border-sage/80">
      {claims.map((c) => (
        <div key={c.id} className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-ink">{c.provider}</p>
            <p className="text-[11px] text-ink-soft">{c.claims} active claims</p>
          </div>
          <span className="text-sm font-bold text-sage-deep">{formatRupee(c.amount)}</span>
        </div>
      ))}
    </div>
  </div>
);
