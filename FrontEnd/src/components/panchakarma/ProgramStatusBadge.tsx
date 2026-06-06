import type { ProgramStatus } from '@/types/panchakarma.types';

const styles: Record<ProgramStatus, { dot: string; text: string }> = {
  Ongoing: { dot: 'bg-success', text: 'text-success' },
  Starting: { dot: 'bg-warning', text: 'text-warning' },
  Complete: { dot: 'bg-success', text: 'text-success' },
  Cancelled: { dot: 'bg-ink-ghost', text: 'text-ink-ghost' },
};

export const ProgramStatusBadge = ({ status }: { status: ProgramStatus }) => (
  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${styles[status].text}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${styles[status].dot}`} />
    {status}
  </span>
);
