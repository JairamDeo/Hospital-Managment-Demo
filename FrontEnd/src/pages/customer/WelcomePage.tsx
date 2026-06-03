import { Link } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { CustomerAuthShell } from '@/components/customer/layout/CustomerAuthShell';
import { ROUTES } from '@/constants/routes';

export const WelcomePage = () => (
  <CustomerAuthShell
    title="Welcome"
    subtitle="Your personal Ayurveda wellness portal — book therapies, track treatments, and manage your care."
  >
    <div className="space-y-4">
      <Link
        to={ROUTES.CUSTOMER_LOGIN}
        className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-border-sage bg-white p-5 shadow-sm transition-colors hover:border-sage-pale hover:bg-sage-mist/40"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-deep text-white">
          <LogIn className="h-6 w-6" strokeWidth={2} />
        </span>
        <span className="text-left">
          <span className="block font-serif text-lg font-semibold text-ink">Existing Login</span>
          <span className="text-sm text-ink-soft">Sign in with mobile OTP</span>
        </span>
      </Link>

      <Link
        to={ROUTES.CUSTOMER_REGISTER}
        className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-border-sage bg-white p-5 shadow-sm transition-colors hover:border-sage-pale hover:bg-sage-mist/40"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-mid text-white">
          <UserPlus className="h-6 w-6" strokeWidth={2} />
        </span>
        <span className="text-left">
          <span className="block font-serif text-lg font-semibold text-ink">New Register</span>
          <span className="text-sm text-ink-soft">Create your patient account</span>
        </span>
      </Link>
    </div>
  </CustomerAuthShell>
);

export default WelcomePage;
