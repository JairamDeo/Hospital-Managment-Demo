/** Resolve patient email for outbound notifications. */
export const resolvePatientEmail = (patient) => {
  const email = String(patient?.email ?? '').trim().toLowerCase();
  if (!email || !email.includes('@')) return null;
  return email;
};

export const maskEmail = (email) => {
  const value = String(email ?? '').trim();
  const at = value.indexOf('@');
  if (at < 2) return '—';
  return `${value.slice(0, 2)}***${value.slice(at)}`;
};
