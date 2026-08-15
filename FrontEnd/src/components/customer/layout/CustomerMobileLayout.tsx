import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, FileText, Home, UserRound } from 'lucide-react';
import { usePatientPortalAuth } from '@/hooks/usePatientPortalAuth';
import { ROUTES } from '@/constants/routes';
import { APP_NAME } from '@/constants/constants';

const navItems = [
  { to: ROUTES.CUSTOMER_HOME, label: 'Home', icon: Home },
  { to: ROUTES.CUSTOMER_APPOINTMENTS, label: 'Appointments', icon: CalendarDays },
  { to: ROUTES.CUSTOMER_REPORTS, label: 'Reports', icon: FileText },
  { to: ROUTES.CUSTOMER_PROFILE, label: 'Profile', icon: UserRound },
] as const;

export const CustomerMobileLayout = () => {
  const { patient } = usePatientPortalAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col bg-cream lg:max-w-2xl xl:max-w-4xl">
      <header className="sticky top-0 z-20 border-b border-border-sage bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-ghost">
          Welcome to {APP_NAME}
        </p>
        <h1 className="font-serif text-xl font-semibold text-ink sm:text-2xl">
          {patient?.name ?? 'Guest'}
        </h1>
        <p className="mt-0.5 text-xs text-ink-soft">
          {patient?.patientCode ? `#${patient.patientCode}` : 'Your wellness portal'}
        </p>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <nav className="sticky bottom-0 z-20 border-t border-border-sage bg-white px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-4">
        <div className="mx-auto flex max-w-md items-center justify-around">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <button
                key={label}
                type="button"
                onClick={() => navigate(to)}
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-semibold transition-colors ${
                  active
                    ? 'cursor-pointer bg-sage-mist text-sage-deep'
                    : 'cursor-pointer text-ink-soft hover:bg-sage-mist hover:text-sage-deep'
                }`}
                aria-label={label}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
                {label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
