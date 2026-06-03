import type { PatientStatus } from '@/types/patient.types';

const styles: Record<PatientStatus, string> = {
  Active: 'bg-success-bg text-success',
  Pending: 'bg-warning-bg text-warning',
  Inactive: 'bg-sage-mist text-ink-soft',
};

export const PatientStatusBadge = ({ status }: { status: PatientStatus }) => (
  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}>
    {status}
  </span>
);
