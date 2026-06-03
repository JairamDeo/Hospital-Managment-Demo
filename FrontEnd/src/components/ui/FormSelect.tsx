import { ChevronDown } from 'lucide-react';
import { formLabelClass, formSelectClass } from '@/components/ui/formStyles';

export interface FormSelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: FormSelectOption[];
  error?: string;
  required?: boolean;
  /** Show empty choice in the list (e.g. "Not set") for optional fields */
  clearable?: boolean;
  clearLabel?: string;
  id?: string;
  className?: string;
}

export const FormSelect = ({
  label,
  value,
  onChange,
  placeholder,
  options,
  error,
  required,
  clearable,
  clearLabel = 'Not set',
  id,
  className = '',
}: FormSelectProps) => (
  <div className={className}>
    {label ? (
      <label htmlFor={id} className={formLabelClass}>
        {label}
      </label>
    ) : null}
    <div className="relative">
      <select
        id={id}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className={`form-field-select ${formSelectClass} pr-9 ${error ? 'border-danger' : ''} ${
          value ? 'text-ink' : 'text-ink-soft'
        }`}
      >
        {clearable ? (
          <option value="">{clearLabel}</option>
        ) : (
          <option value="" hidden>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-deep"
        strokeWidth={2}
        aria-hidden
      />
    </div>
    {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
  </div>
);
