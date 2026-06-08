import type { AppointmentStatus } from '@/types/appointment.types';

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  Soon: 'Pending',
  In: 'Checked In',
  Done: 'Completed',
  Cancelled: 'Cancelled',
};

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  Soon: 'border-warning/40 bg-warning-bg text-warning',
  In: 'border-success/30 bg-success-bg text-success',
  Done: 'border-success/30 bg-success-bg text-success',
  Cancelled: 'border-border-sage bg-cream text-ink-ghost',
};

interface Props {
  status: AppointmentStatus;
}

export const AppointmentStatusBadge = ({ status }: Props) => (
  <span
    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
  >
    {STATUS_LABEL[status]}
  </span>
);
