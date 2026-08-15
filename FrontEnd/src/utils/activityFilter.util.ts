import type { StaffActivityRecord } from '@/types/staffProfile.types';

export type ActivityDateFilter = 'today' | 'week' | 'month' | 'all';

export const ACTIVITY_DATE_FILTERS: { id: ActivityDateFilter; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'all', label: 'All' },
];

const parseActivityDate = (item: StaffActivityRecord): Date | null => {
  if (item.createdAt) {
    const d = new Date(item.createdAt);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
};

const isSameCalendarDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const startOfWeekMonday = (ref: Date) => {
  const d = new Date(ref);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfMonth = (ref: Date) => new Date(ref.getFullYear(), ref.getMonth(), 1);

const endOfDay = (ref: Date) => {
  const d = new Date(ref);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const filterActivityByDate = (
  items: StaffActivityRecord[],
  filter: ActivityDateFilter
): StaffActivityRecord[] => {
  if (filter === 'all') return items;

  const now = new Date();
  const weekStart = startOfWeekMonday(now);
  const monthStart = startOfMonth(now);
  const todayEnd = endOfDay(now);

  return items.filter((item) => {
    const d = parseActivityDate(item);
    if (!d) return false;

    if (filter === 'today') return isSameCalendarDay(d, now);
    if (filter === 'week') return d >= weekStart && d <= todayEnd;
    if (filter === 'month') return d >= monthStart && d <= todayEnd;
    return true;
  });
};
