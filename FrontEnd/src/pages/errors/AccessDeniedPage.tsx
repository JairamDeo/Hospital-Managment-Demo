import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants/routes';

export const AccessDeniedPage = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 text-center">
    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-danger-bg text-danger">
      <ShieldX className="h-8 w-8" strokeWidth={1.75} />
    </div>
    <h1 className="text-2xl font-bold text-ink">Access Denied</h1>
    <p className="mt-2 max-w-md text-sm text-ink-soft">
      You do not have permission to view this page. Please sign in with an authorized admin
      account.
    </p>
    <Link to={ROUTES.ADMIN_LOGIN} className="mt-8">
      <Button>Go to Login</Button>
    </Link>
  </div>
);

export default AccessDeniedPage;
