import {
  CalendarDays,
  Leaf,
  Pill,
  Receipt,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { AppNotification, NotificationType } from './mockNotifications';

const TYPE_CONFIG: Record<NotificationType, { icon: LucideIcon; tone: string }> = {
  appointment: { icon: CalendarDays, tone: 'bg-blue-50 text-blue-600' },
  billing: { icon: Receipt, tone: 'bg-amber-50 text-amber-600' },
  pharmacy: { icon: Pill, tone: 'bg-violet-50 text-violet-600' },
  panchakarma: { icon: Leaf, tone: 'bg-emerald-50 text-emerald-600' },
  patient: { icon: Users, tone: 'bg-pink-50 text-pink-600' },
};

interface Props {
  open: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export const NotificationsModal = ({
  open,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
}: Props) => {
  const navigate = useNavigate();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleClick = (n: AppNotification) => {
    if (!n.read) onMarkRead(n.id);
    if (n.href) {
      onClose();
      navigate(n.href);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Notifications"
      subtitle={
        unreadCount > 0
          ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
          : 'All caught up'
      }
      size="lg"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onMarkAllRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </Button>
          <Button onClick={onClose}>Close</Button>
        </>
      }
    >
      {notifications.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-soft">No notifications</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const { icon: Icon, tone } = TYPE_CONFIG[n.type];
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => handleClick(n)}
                className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                  n.read
                    ? 'border-border-sage/60 bg-white hover:bg-sage-mist/40'
                    : 'border-sage-pale bg-sage-mist/30 hover:bg-sage-mist/60'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm ${n.read ? 'font-medium text-ink-soft' : 'font-semibold text-ink'}`}
                    >
                      {n.title}
                    </p>
                    {!n.read ? (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sage-deep" />
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">{n.message}</p>
                  <p className="mt-1 text-xs text-ink-ghost">{n.time}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
};
