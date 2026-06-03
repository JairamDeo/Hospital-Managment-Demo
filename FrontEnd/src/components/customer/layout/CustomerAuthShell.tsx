import { Link } from 'react-router-dom';
import { ArrowLeft, TreePine } from 'lucide-react';
import { APP_NAME } from '@/constants/constants';
import { ROUTES } from '@/constants/routes';

interface Props {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backTo?: string;
  children: React.ReactNode;
}

export const CustomerAuthShell = ({
  title,
  subtitle,
  showBack = false,
  backTo = ROUTES.CUSTOMER_WELCOME,
  children,
}: Props) => (
  <div className="flex min-h-screen flex-col bg-cream">
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6 sm:max-w-md sm:px-6 lg:max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        {showBack ? (
          <Link
            to={backTo}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-sage bg-white text-ink-soft hover:bg-sage-mist"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        ) : null}
        <div className="min-w-0 flex-1 text-center">
          <p className="text-sm font-medium text-ink-soft">{title}</p>
        </div>
        {showBack ? <span className="w-10" aria-hidden /> : null}
      </div>

      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sage-deep text-white shadow-md">
          <TreePine className="h-8 w-8" strokeWidth={1.75} />
        </div>
        <h1 className="font-serif text-2xl font-bold text-sage-deep">{APP_NAME}</h1>
        {subtitle ? <p className="mt-2 max-w-xs text-sm text-ink-soft">{subtitle}</p> : null}
      </div>

      <div className="flex-1">{children}</div>

      <p className="mt-8 text-center text-[11px] text-ink-ghost">
        Holistic Ayurveda care · Secure OTP login
      </p>
    </div>
  </div>
);
