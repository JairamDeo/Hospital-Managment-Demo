import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
  children: ReactNode;
}

export const Button = ({
  variant = 'primary',
  isLoading,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  const base =
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-btn px-btn-x py-btn-y text-sm font-semibold tracking-[-0.01em] transition-[background-color,border-color,box-shadow,color] duration-150 disabled:cursor-not-allowed disabled:opacity-55';
  const variants = {
    primary: 'bg-sage-deep text-white shadow-sm hover:bg-sage-mid hover:shadow',
    secondary:
      'border border-border-sage/90 bg-white text-ink shadow-[0_1px_1px_rgb(22_40_32/0.03)] hover:border-sage-pale hover:bg-sage-mist/70',
    ghost: 'text-sage-deep hover:bg-sage-mist/80',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : null}
      {children}
    </button>
  );
};
