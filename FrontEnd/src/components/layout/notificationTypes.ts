import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  FlaskConical,
  Info,
  Leaf,
  Pill,
  Receipt,
  Users,
} from 'lucide-react';

export type NotificationType =
  | 'appointment'
  | 'billing'
  | 'pharmacy'
  | 'panchakarma'
  | 'patient'
  | 'lab_order'
  | 'lab_report'
  | 'info';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  href?: string;
}

export const NOTIFICATION_TYPE_CONFIG: Record<
  NotificationType,
  { icon: LucideIcon; tone: string }
> = {
  appointment: { icon: CalendarDays, tone: 'bg-blue-50 text-blue-600' },
  billing: { icon: Receipt, tone: 'bg-amber-50 text-amber-600' },
  pharmacy: { icon: Pill, tone: 'bg-violet-50 text-violet-600' },
  panchakarma: { icon: Leaf, tone: 'bg-emerald-50 text-emerald-600' },
  patient: { icon: Users, tone: 'bg-pink-50 text-pink-600' },
  lab_order: { icon: FlaskConical, tone: 'bg-teal-50 text-teal-700' },
  lab_report: { icon: FlaskConical, tone: 'bg-cyan-50 text-cyan-700' },
  info: { icon: Info, tone: 'bg-sage-mist text-sage-deep' },
};

export const formatNotificationTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export const mapApiNotification = (row: {
  _id: string;
  title: string;
  message: string;
  href?: string;
  type?: string;
  readAt?: string | null;
  createdAt?: string;
}): AppNotification => {
  const rawType = row.type || 'info';
  const type = (
    [
      'appointment',
      'billing',
      'pharmacy',
      'panchakarma',
      'patient',
      'lab_order',
      'lab_report',
      'info',
    ].includes(rawType)
      ? rawType
      : 'info'
  ) as NotificationType;

  return {
    id: String(row._id),
    type,
    title: row.title,
    message: row.message,
    href: row.href || undefined,
    read: Boolean(row.readAt),
    time: formatNotificationTime(row.createdAt),
  };
};
