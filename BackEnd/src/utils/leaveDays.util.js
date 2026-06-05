import moment from 'moment';

/** Inclusive date range → individual dates (YYYY-MM-DD), excluding Sundays. */
export const datesInRangeExcludingSunday = (startDate, endDate) => {
  const dates = [];
  const cur = moment(startDate, 'YYYY-MM-DD').startOf('day');
  const end = moment(endDate, 'YYYY-MM-DD').startOf('day');
  if (!cur.isValid() || !end.isValid() || cur.isAfter(end)) return dates;

  while (cur.isSameOrBefore(end)) {
    if (cur.day() !== 0) dates.push(cur.format('YYYY-MM-DD'));
    cur.add(1, 'day');
  }
  return dates;
};

export const countLeaveDaysExcludingSunday = (startDate, endDate) =>
  datesInRangeExcludingSunday(startDate, endDate).length;
