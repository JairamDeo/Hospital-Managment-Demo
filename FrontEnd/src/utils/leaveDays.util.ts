/** Inclusive range → YYYY-MM-DD dates excluding Sundays. */
export const datesInRangeExcludingSunday = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const cur = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  if (Number.isNaN(cur.getTime()) || Number.isNaN(end.getTime()) || cur > end) return dates;

  const walk = new Date(cur);
  while (walk <= end) {
    if (walk.getDay() !== 0) {
      dates.push(walk.toISOString().slice(0, 10));
    }
    walk.setDate(walk.getDate() + 1);
  }
  return dates;
};

export const countLeaveDaysExcludingSunday = (startDate: string, endDate: string) =>
  datesInRangeExcludingSunday(startDate, endDate).length;
