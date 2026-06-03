import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { TOAST_DURATION_MS } from '@/constants/constants';

const ToastBar = ({
  progress,
  type,
}: {
  progress: number;
  type: 'success' | 'error' | 'info';
}) => {
  const barColor =
    type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-sage';
  return (
    <div className="absolute bottom-0 left-0 h-0.5 w-full bg-sage-mist">
      <div
        className={`h-full transition-all duration-100 ease-linear ${barColor}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

const ToastItemView = ({
  id,
  message,
  type,
  onDismiss,
}: {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  onDismiss: (id: string) => void;
}) => {
  const [progress, setProgress] = useState(100);
  const borderColor =
    type === 'success'
      ? 'border-success'
      : type === 'error'
        ? 'border-danger'
        : 'border-sage';

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / TOAST_DURATION_MS) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss(id);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [id, onDismiss]);

  return (
    <div
      className={`relative overflow-hidden rounded-btn border bg-white px-4 py-3 shadow-sm ${borderColor}`}
      role="alert"
    >
      <div className="flex items-start gap-3 pr-6">
        <p className="text-sm font-medium text-ink">{message}</p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="absolute right-2 top-2 rounded p-1 text-ink-ghost hover:bg-sage-mist hover:text-ink"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <ToastBar progress={progress} type={type} />
    </div>
  );
};

export const ToastContainer = () => {
  const { toasts, dismissToast } = useToast();

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[400] flex w-full max-w-sm flex-col gap-2 sm:right-6">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItemView
            id={t.id}
            message={t.message}
            type={t.type}
            onDismiss={dismissToast}
          />
        </div>
      ))}
    </div>
  );
};
