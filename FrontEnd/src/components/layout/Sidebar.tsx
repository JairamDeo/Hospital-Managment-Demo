import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Leaf,
  BedDouble,
  Pill,
  UserCog,
  BarChart3,
  Receipt,
  Settings,
  Database,
  TreePine,
  LogOut,
  X,
  UserRound,
  ShieldCheck,
  FlaskConical,
} from 'lucide-react';
import { ROUTES, staffDetailPath } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useSidebar } from '@/context/SidebarContext';
import { getInitials, formatDisplayName } from '@/utils/helpers';
import { useToast } from '@/hooks/useToast';
import { usePatientNavStats } from '@/hooks/usePatientNavStats';
import { useAppointmentNavStats } from '@/hooks/useAppointmentNavStats';
import type { RbacModuleKey } from '@/types/rbac.types';

type NavItemDef = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  module: RbacModuleKey;
  badge?: string;
};

const mainNavBase: NavItemDef[] = [
  { to: ROUTES.ADMIN_DASHBOARD, label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' },
  { to: ROUTES.ADMIN_PATIENTS, label: 'Patients', icon: Users, module: 'patients' },
  { to: ROUTES.ADMIN_PATIENT_INSURANCE, label: 'Health Insurance', icon: ShieldCheck, module: 'patientInsurance' },
  {
    to: ROUTES.ADMIN_APPOINTMENTS,
    label: 'Appointments',
    icon: CalendarDays,
    module: 'appointments',
  },
  { to: ROUTES.ADMIN_PANCHAKARMA, label: 'Panchakarma', icon: Leaf, module: 'panchakarma' },
  { to: ROUTES.ADMIN_IPD, label: 'IPD', icon: BedDouble, module: 'ipd' },
  { to: ROUTES.ADMIN_LAB, label: 'Lab', icon: FlaskConical, module: 'lab' },
];

const manageNav: NavItemDef[] = [
  { to: ROUTES.ADMIN_MASTER_DATA, label: 'Master Data', icon: Database, module: 'masterData' },
  { to: ROUTES.ADMIN_PHARMACY, label: 'Pharmacy', icon: Pill, module: 'pharmacy' },
  { to: ROUTES.ADMIN_STAFF, label: 'Staff', icon: UserCog, module: 'staff' },
  { to: ROUTES.ADMIN_ANALYTICS, label: 'Analytics', icon: BarChart3, module: 'analytics' },
  { to: ROUTES.ADMIN_BILLING, label: 'Billing', icon: Receipt, module: 'billing' },
  { to: ROUTES.ADMIN_SETTINGS, label: 'Settings', icon: Settings, module: 'settings' },
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
      `flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium tracking-[-0.01em] transition-[background-color,color,box-shadow] duration-150 ${
        isActive
          ? 'bg-sage-deep text-white shadow-sm'
          : 'text-ink-soft hover:bg-sage-mist/80 hover:text-ink'
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
  const { badge: appointmentBadge } = useAppointmentNavStats();
  const { user, logout } = useAuth();
  const { canView, isStaff, staffCode } = usePermissions();
  const { isCollapsed, closeMobile } = useSidebar();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const filterNav = (items: NavItemDef[]) =>
    items
      .filter((item) => canView(item.module))
      .map((item) => {
        if (item.to === ROUTES.ADMIN_PATIENTS) return { ...item, badge: patientBadge };
        if (item.to === ROUTES.ADMIN_APPOINTMENTS) return { ...item, badge: appointmentBadge };
        return item;
      });

  const mainNav = filterNav(mainNavBase);
  const manageItems = filterNav(manageNav);

  const profileLink =
    isStaff && staffCode
      ? [{ to: staffDetailPath(staffCode), label: 'My Profile', icon: UserRound, module: 'staff' as const }]
      : [];

  const collapsed = variant === 'desktop' && isCollapsed;
  const onNavigate = variant === 'mobile' ? closeMobile : undefined;

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'success');
    closeMobile();
    navigate(ROUTES.ADMIN_LOGIN);
  };

  const displayName = formatDisplayName(user?.firstName, user?.lastName, user?.name);
  const subtitle = isStaff ? user?.title || user?.staffRole : 'Administrator';
  const initials = getInitials(user?.firstName, user?.lastName, user?.name);

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
        {!collapsed && (
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
        {!collapsed && mainNav.length > 0 && (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-ink-ghost">
            Main
          </p>
        )}
        <div className="mb-6 space-y-1">
          {mainNav.map((item) => (
            <NavItem key={item.to} {...item} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </div>
        {profileLink.length > 0 ? (
          <div className="mb-6 space-y-1">
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-ink-ghost">
                Profile
              </p>
            )}
            {profileLink.map((item) => (
              <NavItem key={item.to} {...item} collapsed={collapsed} onNavigate={onNavigate} />
            ))}
          </div>
        ) : null}
        {!collapsed && manageItems.length > 0 && (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-ink-ghost">
            Manage
          </p>
        )}
        <div className="space-y-1">
          {manageItems.map((item) => (
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
              <p className="truncate font-serif text-sm font-semibold text-ink">{displayName}</p>
              <p className="truncate text-xs text-ink-soft">{subtitle}</p>
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
