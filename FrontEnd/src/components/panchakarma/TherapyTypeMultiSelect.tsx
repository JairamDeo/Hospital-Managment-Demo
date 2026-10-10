import { THERAPY_OPTIONS, type TherapyType } from '@/types/panchakarma.types';
import { formLabelClass } from '@/components/ui/formStyles';

interface Props {
  value: TherapyType[];
  onChange: (next: TherapyType[]) => void;
  disabled?: boolean;
  label?: string;
}

export const TherapyTypeMultiSelect = ({
  value,
  onChange,
  disabled = false,
  label = 'Therapy type',
}: Props) => {
  const toggle = (therapy: TherapyType) => {
    if (disabled) return;
    if (value.includes(therapy)) {
      onChange(value.filter((t) => t !== therapy));
    } else {
      onChange([...value, therapy]);
    }
  };

  return (
    <div>
      <span className={formLabelClass}>{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {THERAPY_OPTIONS.map((therapy) => {
          const selected = value.includes(therapy);
          return (
            <button
              key={therapy}
              type="button"
              disabled={disabled}
              onClick={() => toggle(therapy)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                selected
                  ? 'border-sage-deep bg-sage-deep text-white'
                  : 'border-border-sage bg-white text-ink-soft hover:border-sage-light hover:bg-sage-mist/40'
              }`}
            >
              {therapy}
            </button>
          );
        })}
      </div>
    </div>
  );
};
