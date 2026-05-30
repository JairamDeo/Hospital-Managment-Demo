import { Calendar } from 'lucide-react';

export const DateTimeWidget = () => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="hidden items-center gap-2.5 rounded-xl border border-border-sage bg-cream px-3 py-2 sm:flex">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sage-deep">
        <Calendar className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div className="leading-tight">
        <p className="text-xs font-bold text-ink">{timeStr}</p>
        <p className="text-[11px] text-ink-soft">{dateStr}</p>
      </div>
    </div>
  );
};
