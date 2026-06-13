import { NavLink } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { usePermissions } from '@/hooks/usePermissions';

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
    isActive
      ? 'border-sage-deep bg-sage-mist text-sage-deep'
      : 'border-border-sage bg-white text-ink-soft hover:bg-sage-mist/60'
  }`;

export const StaffSectionNav = () => {
  const { canView } = usePermissions();

  const tabs = [
    { to: ROUTES.ADMIN_STAFF, label: 'Directory', module: 'staff' as const },
    { to: ROUTES.ADMIN_STAFF_COMPENSATION, label: 'Compensation', module: 'staff' as const },
  ].filter((t) => canView(t.module));

  if (tabs.length <= 1) return null;

  return (
    <nav className="mb-5 flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} className={tabClass}>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
};
