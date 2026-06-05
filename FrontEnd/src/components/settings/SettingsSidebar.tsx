import {
  Bell,
  Building2,
  CalendarDays,
  Leaf,
  LockKeyhole,
  Receipt,
  Shield,
  User,
  type LucideIcon,
} from 'lucide-react';
import type { SettingsSectionId } from '@/pages/settings/data/mockSettings';

const ALL_NAV: { id: SettingsSectionId; label: string; icon: LucideIcon; adminOnly?: boolean }[] =
  [
    { id: 'clinic', label: 'Clinic Profile', icon: Building2, adminOnly: true },
    { id: 'account', label: 'My Account', icon: User },
    { id: 'appointments', label: 'Appointments', icon: CalendarDays, adminOnly: true },
    { id: 'billing', label: 'Billing', icon: Receipt, adminOnly: true },
    { id: 'panchakarma', label: 'Panchakarma', icon: Leaf, adminOnly: true },
    { id: 'notifications', label: 'Notifications', icon: Bell, adminOnly: true },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'rbac', label: 'Access Control', icon: LockKeyhole, adminOnly: true },
  ];

interface Props {
  active: SettingsSectionId;
  onChange: (id: SettingsSectionId) => void;
  isAdmin?: boolean;
}

export const SettingsSidebar = ({ active, onChange, isAdmin = false }: Props) => {
  const nav = ALL_NAV.filter((item) => !item.adminOnly || isAdmin);
  return (
  <nav className="flex flex-row gap-1 overflow-x-auto rounded-2xl border border-border-sage bg-white p-1.5 shadow-sm scrollbar-thin lg:flex-col lg:overflow-visible">
    {nav.map(({ id, label, icon: Icon }) => {
      const isActive = active === id;
      return (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors lg:w-full ${
            isActive
              ? 'bg-sage-deep text-white shadow-sm'
              : 'text-ink-soft hover:bg-sage-mist hover:text-ink'
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="whitespace-nowrap">{label}</span>
        </button>
      );
    })}
  </nav>
  );
};
