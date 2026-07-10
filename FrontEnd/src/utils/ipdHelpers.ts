/** Avoid "Dr. Dr. Name" when staff name already includes title. */
export const formatDoctorLabel = (name?: string | null) => {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return '—';
  if (/^dr\.?\s/i.test(trimmed)) return trimmed;
  return `Dr. ${trimmed}`;
};

export const formatIpdDateTime = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

export const formatIpdDate = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { dateStyle: 'medium' });
};

export const roomOccupancyPercent = (occupied: number, capacity: number) => {
  if (!capacity) return 0;
  return Math.min(100, Math.round((occupied / capacity) * 100));
};

export const formatBpFromParts = (systolic: string, diastolic: string) => {
  const sys = systolic.trim();
  const dia = diastolic.trim();
  if (sys && dia) return `${sys}/${dia}`;
  return sys || dia || '';
};

export const parseBpValue = (bp?: string | null) => {
  const raw = (bp ?? '').trim();
  if (!raw) return { systolic: '', diastolic: '' };
  const [systolic = '', diastolic = ''] = raw.split('/');
  return { systolic: systolic.trim(), diastolic: diastolic.trim() };
};
