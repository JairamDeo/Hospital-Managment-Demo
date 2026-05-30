export type CalendarView = 'month' | 'week' | 'day';

interface Props {
  value: CalendarView;
  onChange: (view: CalendarView) => void;
}

const views: { id: CalendarView; label: string }[] = [
  { id: 'month', label: 'Month' },
  { id: 'week', label: 'Week' },
  { id: 'day', label: 'Day' },
];

export const ViewSwitcher = ({ value, onChange }: Props) => (
  <div className="inline-flex rounded-lg border border-border-sage bg-white p-0.5">
    {views.map((v) => {
      const active = value === v.id;
      return (
        <button
          key={v.id}
          type="button"
          onClick={() => onChange(v.id)}
          className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            active
              ? 'bg-sage-deep text-white shadow-sm'
              : 'text-ink-soft hover:bg-sage-mist/60 hover:text-ink'
          }`}
        >
          {v.label}
        </button>
      );
    })}
  </div>
);
