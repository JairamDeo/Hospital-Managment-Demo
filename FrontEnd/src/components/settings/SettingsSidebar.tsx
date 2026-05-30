import {
  Bell,
  Building2,
  CalendarDays,
  Leaf,
  Receipt,
  Shield,
  User,
  type LucideIcon,
} from 'lucide-react';
import type { SettingsSectionId } from '@/pages/settings/data/mockSettings';

const NAV: { id: SettingsSectionId; label: string; icon: LucideIcon }[] = [
  { id: 'clinic', label: 'Clinic Profile', icon: Building2 },
  { id: 'account', label: 'My Account', icon: User },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
  { id: 'billing', label: 'Billing', icon: Receipt },
  { id: 'panchakarma', label: 'Panchakarma', icon: Leaf },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

interface Props {
  active: SettingsSectionId;
  onChange: (id: SettingsSectionId) => void;
}

export const SettingsSidebar = ({ active, onChange }: Props) => (
  <nav className="flex flex-row gap-1 overflow-x-auto rounded-2xl border border-border-sage bg-white p-1.5 shadow-sm scrollbar-thin lg:flex-col lg:overflow-visible">
    {NAV.map(({ id, label, icon: Icon }) => {
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
