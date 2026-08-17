/** Treat unset or placeholder env values as "not configured" (local + Vercel demo). */
export const isConfiguredSecret = (value) => {
  if (value == null) return false;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === '...') return false;

  const lower = trimmed.toLowerCase();
  if (lower.startsWith('your_')) return false;
  if (lower.includes('replace') || lower.includes('your ')) return false;
  if (/^x+$/i.test(trimmed)) return false;

  return true;
};
