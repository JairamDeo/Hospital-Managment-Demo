import { TreePine } from 'lucide-react';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => (
  <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-8">
    <div className="w-full max-w-md">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-deep text-white shadow-sm">
          <TreePine className="h-7 w-7" strokeWidth={1.5} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-ghost">
          Ayurveda Health
        </p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-ink">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-ink-soft">{subtitle}</p> : null}
      </div>
      <div className="rounded-card border border-border-sage bg-white p-6 shadow-sm sm:p-8">
        {children}
      </div>
    </div>
  </div>
);
