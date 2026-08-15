import type { TimeRange } from '@/pages/analytics/data/mockAnalytics';

const ranges: TimeRange[] = ['7D', '30D', '90D', '1Y'];

interface Props {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export const TimeRangeSwitcher = ({ value, onChange }: Props) => (
  <div className="inline-flex rounded-lg border border-border-sage bg-white p-0.5">
    {ranges.map((r) => (
      <button
        key={r}
        type="button"
        onClick={() => onChange(r)}
        className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
          value === r
            ? 'bg-sage-deep text-white shadow-sm'
            : 'text-ink-soft hover:bg-sage-mist/60 hover:text-ink'
        }`}
      >
        {r}
      </button>
    ))}
  </div>
);
