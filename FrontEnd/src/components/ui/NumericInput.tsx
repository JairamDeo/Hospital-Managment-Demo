import { useEffect, useState } from 'react';
import { formInputClass } from './formStyles';

export const formNoSpinnerClass =
  '[appearance:textfield] [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

type NumericInputProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  allowDecimal?: boolean;
  className?: string;
  placeholder?: string;
  id?: string;
  'aria-label'?: string;
};

const isValidDraft = (raw: string, allowDecimal: boolean) =>
  allowDecimal ? /^-?\d*\.?\d*$/.test(raw) : /^\d*$/.test(raw);

export const NumericInput = ({
  value,
  onChange,
  min,
  max,
  allowDecimal = false,
  className = '',
  placeholder,
  id,
  'aria-label': ariaLabel,
}: NumericInputProps) => {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === '' || trimmed === '.' || trimmed === '-') {
      const fallback = min ?? 0;
      onChange(fallback);
      setDraft(String(fallback));
      return;
    }

    const parsed = allowDecimal ? parseFloat(trimmed) : parseInt(trimmed, 10);
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }

    let next = parsed;
    if (min != null) next = Math.max(min, next);
    if (max != null) next = Math.min(max, next);
    onChange(next);
    setDraft(String(next));
  };

  return (
    <input
      id={id}
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      aria-label={ariaLabel}
      placeholder={placeholder}
      value={draft}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        commit(draft);
      }}
      onChange={(e) => {
        const raw = e.target.value;
        if (isValidDraft(raw, allowDecimal)) setDraft(raw);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
      className={`${formInputClass} ${formNoSpinnerClass} ${className}`.trim()}
    />
  );
};
