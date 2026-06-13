/** YYYY-MM-DD from a date input value */
const toInputDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const monthsBetweenDates = (mfg: string, expiry: string): number | null => {
  if (!mfg || !expiry) return null;
  const start = new Date(`${mfg}T00:00:00`);
  const end = new Date(`${expiry}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null;
  const years = end.getFullYear() - start.getFullYear();
  const months = end.getMonth() - start.getMonth();
  const days = end.getDate() - start.getDate();
  let total = years * 12 + months;
  if (days >= 15) total += 1;
  else if (days < -15) total -= 1;
  return Math.max(1, total);
};

export const expiryFromShelfMonths = (mfg: string, months: number): string | null => {
  if (!mfg || !Number.isFinite(months) || months < 1) return null;
  const d = new Date(`${mfg}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + Math.round(months));
  return toInputDate(d);
};
