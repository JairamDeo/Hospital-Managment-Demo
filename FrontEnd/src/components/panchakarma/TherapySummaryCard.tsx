import { Droplets, Flower2, Leaf, Wind } from 'lucide-react';
import type { TherapySummary, TherapyType } from '@/types/panchakarma.types';

const icons: Record<TherapyType, typeof Leaf> = {
  Vamana: Wind,
  Virechana: Droplets,
  Basti: Leaf,
  Nasya: Flower2,
};

interface Props {
  summary: TherapySummary;
}

export const TherapySummaryCard = ({ summary }: Props) => {
  const Icon = icons[summary.therapy];

  return (
    <div className="overflow-hidden rounded-xl border border-border-sage bg-white">
      <div className="p-3">
        <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${summary.iconBg}`}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <p className="text-[13px] font-bold text-ink">{summary.therapy}</p>
        <p className="mt-0.5 text-[10px] text-ink-soft">{summary.subtitle}</p>
        <p className={`mt-1.5 text-base font-bold leading-none ${summary.accent}`}>
          {summary.activeSessions}
        </p>
        <p className="mt-0.5 text-[10px] font-medium text-ink-ghost">Active Sessions</p>
      </div>
      <div className={`h-1 ${summary.barColor}`} />
    </div>
  );
};
