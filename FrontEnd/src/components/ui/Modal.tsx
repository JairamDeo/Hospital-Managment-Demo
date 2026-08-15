import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  contentClassName?: string;
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-5xl',
  '2xl': 'max-w-6xl',
  full: 'max-w-[96vw]',
};

export const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  contentClassName,
}: ModalProps) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close modal overlay"
      />
      <div
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-border-sage bg-white shadow-xl ${sizes[size]}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex shrink-0 items-start justify-between border-b border-border-sage px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-ink">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-ink-ghost hover:bg-sage-mist hover:text-ink"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className={`min-h-0 flex-1 overflow-y-auto px-5 py-4 ${contentClassName ?? ''}`}>
          {children}
        </div>
        {footer ? (
          <div className="flex shrink-0 justify-end gap-2 border-t border-border-sage px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
};
