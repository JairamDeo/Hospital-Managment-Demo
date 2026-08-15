import { useCallback, useEffect, useState } from 'react';
import { Bell, ChevronRight, Search, PanelLeftClose, PanelLeftOpen, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/context/SidebarContext';
import { getInitials } from '@/utils/helpers';
import { DateTimeWidget } from './DateTimeWidget';
import { GlobalSearchModal } from './GlobalSearchModal';
import { NotificationsModal } from './NotificationsModal';
import { mapApiNotification, type AppNotification } from '@/components/layout/notificationTypes';
import { notificationAdminService } from '@/services/notification/notificationAdmin.service';

export interface Breadcrumb {
  label: string;
  href?: string;
}

interface HeaderProps {
  title?: string;
  breadcrumbs?: Breadcrumb[];
}

export const Header = ({ title, breadcrumbs }: HeaderProps) => {
  const { user } = useAuth();
  const { toggleCollapsed, isCollapsed, openMobile } = useSidebar();
  const initials = getInitials(user?.firstName, user?.lastName);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    setLoadingNotifs(true);
    try {
      const res = await notificationAdminService.list();
      const rows = res.data.res?.notifications ?? [];
      setNotifications(rows.map(mapApiNotification));
    } catch {
      setNotifications([]);
    } finally {
      setLoadingNotifs(false);
    }
  }, [user]);

  useEffect(() => {
    void loadNotifications();
    const timer = window.setInterval(() => {
      void loadNotifications();
    }, 60000);
    return () => window.clearInterval(timer);
  }, [loadNotifications]);

  useEffect(() => {
    if (notificationsOpen) void loadNotifications();
  }, [notificationsOpen, loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await notificationAdminService.markRead(id);
    } catch {
      void loadNotifications();
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await notificationAdminService.markAllRead();
    } catch {
      void loadNotifications();
    }
  };

  return (
    <header className="z-30 flex h-[56px] shrink-0 items-center justify-between border-b border-border-sage/80 bg-white/95 px-4 backdrop-blur-sm sm:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={openMobile}
          className="cursor-pointer rounded-lg p-2 text-ink-soft hover:bg-sage-mist lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="hidden cursor-pointer rounded-lg p-2 text-ink-soft hover:bg-sage-mist lg:flex"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-5 w-5" strokeWidth={1.75} />
          ) : (
            <PanelLeftClose className="h-5 w-5" strokeWidth={1.75} />
          )}
        </button>
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav className="flex min-w-0 items-center gap-1 text-sm" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <span key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-1">
                  {i > 0 ? (
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-ghost" strokeWidth={2} />
                  ) : null}
                  {crumb.href && !isLast ? (
                    <Link
                      to={crumb.href}
                      className="truncate font-medium text-ink-soft hover:text-sage-deep"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className={`truncate font-serif font-semibold ${isLast ? 'text-ink' : 'text-ink-soft'}`}
                    >
                      {crumb.label}
                    </span>
                  )}
                </span>
              );
            })}
          </nav>
        ) : (
          <h1 className="truncate text-lg font-bold text-ink">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="cursor-pointer rounded-lg p-2 text-ink-soft hover:bg-sage-mist"
          aria-label="Search"
        >
          <Search className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={() => setNotificationsOpen(true)}
          className="relative cursor-pointer rounded-lg p-2 text-ink-soft hover:bg-sage-mist"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </button>
        <DateTimeWidget />
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-pale text-xs font-bold text-sage-deep">
          {initials}
        </div>
      </div>

      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      <NotificationsModal
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        loading={loadingNotifs}
        onMarkRead={(id) => void markRead(id)}
        onMarkAllRead={() => void markAllRead()}
      />
    </header>
  );
};
