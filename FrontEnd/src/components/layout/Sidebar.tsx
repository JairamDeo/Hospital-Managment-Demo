import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Leaf,
  Pill,
  UserCog,
  BarChart3,
  Receipt,
  Settings,
  Database,
  TreePine,
  LogOut,
  X,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/context/SidebarContext';
import { getInitials, formatDisplayName } from '@/utils/helpers';
import { useToast } from '@/hooks/useToast';
import { usePatientNavStats } from '@/hooks/usePatientNavStats';

const mainNavBase = [
  { to: ROUTES.ADMIN_DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.ADMIN_PATIENTS, label: 'Patients', icon: Users },
  { to: ROUTES.ADMIN_APPOINTMENTS, label: 'Appointments', icon: CalendarDays, badge: '22' },
  { to: ROUTES.ADMIN_PANCHAKARMA, label: 'Panchakarma', icon: Leaf },
];

const manageNav = [
  { to: ROUTES.ADMIN_MASTER_DATA, label: 'Master Data', icon: Database },
  { to: ROUTES.ADMIN_PHARMACY, label: 'Pharmacy', icon: Pill },
  { to: ROUTES.ADMIN_STAFF, label: 'Staff', icon: UserCog },
  { to: ROUTES.ADMIN_ANALYTICS, label: 'Analytics', icon: BarChart3 },
  { to: ROUTES.ADMIN_BILLING, label: 'Billing', icon: Receipt },
  { to: ROUTES.ADMIN_SETTINGS, label: 'Settings', icon: Settings },
];

const NavItem = ({
  to,
  label,
  icon: Icon,
  badge,
  collapsed,
  onNavigate,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) => (
  <NavLink
    to={to}
    onClick={onNavigate}
    title={collapsed ? label : undefined}
    className={({ isActive }) =>
      `flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-sage-deep text-white shadow-sm'
          : 'text-ink-soft hover:bg-sage-mist hover:text-ink'
      } ${collapsed ? 'justify-center px-2' : ''}`
    }
  >
    <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
    {!collapsed && <span className="flex-1">{label}</span>}
    {!collapsed && badge ? (
      <span className="rounded-full bg-sage-pale px-2 py-0.5 text-xs font-semibold text-sage-deep">
        {badge}
      </span>
    ) : null}
  </NavLink>
);

interface SidebarProps {
  variant?: 'desktop' | 'mobile';
}

export const Sidebar = ({ variant = 'desktop' }: SidebarProps) => {
  const { badge: patientBadge } = usePatientNavStats();
  const mainNav = mainNavBase.map((item) =>
    item.to === ROUTES.ADMIN_PATIENTS ? { ...item, badge: patientBadge } : item
  );
  const { user, logout } = useAuth();
  const { isCollapsed, closeMobile } = useSidebar();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const collapsed = variant === 'desktop' && isCollapsed;
  const onNavigate = variant === 'mobile' ? closeMobile : undefined;

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'success');
    closeMobile();
    navigate(ROUTES.ADMIN_LOGIN);
  };

  const initials = getInitials(user?.firstName, user?.lastName);
  const displayName = formatDisplayName(user?.firstName, user?.lastName, user?.name);

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col border-r border-border-sage bg-white transition-[width] duration-300 ease-in-out ${
        collapsed ? 'w-[72px]' : 'w-64'
      } ${variant === 'desktop' ? 'hidden lg:flex' : 'w-64'}`}
    >
      <div
        className={`flex w-full items-center border-b border-border-sage py-5 ${
          collapsed ? 'justify-center px-2' : 'gap-3 px-5'
        }`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-deep text-white">
          <TreePine className="h-5 w-5" strokeWidth={1.75} />
        </div>
        {!collapsed && variant !== 'mobile' && (
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-ghost">Ayurveda</p>
            <p className="font-serif text-base font-semibold leading-tight text-ink">Health</p>
          </div>
        )}
        {!collapsed && variant === 'mobile' && (
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-ghost">Ayurveda</p>
            <p className="font-serif text-base font-semibold leading-tight text-ink">Health</p>
          </div>
        )}
        {variant === 'mobile' && (
          <button
            type="button"
            onClick={closeMobile}
            className="ml-auto shrink-0 rounded-lg p-1.5 text-ink-soft hover:bg-sage-mist"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
        {!collapsed && (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-ink-ghost">
            Main
          </p>
        )}
        <div className="mb-6 space-y-1">
          {mainNav.map((item) => (
            <NavItem key={item.to} {...item} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </div>
        {!collapsed && (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-ink-ghost">
            Manage
          </p>
        )}
        <div className="space-y-1">
          {manageNav.map((item) => (
            <NavItem key={item.to} {...item} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>

      <div className={`border-t border-border-sage p-3 ${collapsed ? 'px-2' : 'p-4'}`}>
        <div
          className={`flex items-center gap-3 rounded-xl bg-sage-mist/50 p-3 ${
            collapsed ? 'flex-col justify-center' : ''
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-pale text-sm font-bold text-sage-deep">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-sm font-semibold text-ink">Dr. {displayName}</p>
              <p className="text-xs text-ink-soft">Chief Physician</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
            className={`flex shrink-0 items-center justify-center rounded-xl bg-white p-2.5 text-ink-soft shadow-sm ring-1 ring-border-sage transition-colors hover:bg-danger-bg hover:text-danger ${
              collapsed ? 'w-full' : ''
            }`}
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  );
};
