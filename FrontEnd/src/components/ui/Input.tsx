import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label ? (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-btn border border-border-sage bg-white px-input-x py-input-y text-sm text-ink outline-none transition placeholder:text-ink-ghost focus:border-sage focus:ring-2 focus:ring-sage-pale ${error ? 'border-danger' : ''} ${className}`}
          {...props}
        />
        {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
