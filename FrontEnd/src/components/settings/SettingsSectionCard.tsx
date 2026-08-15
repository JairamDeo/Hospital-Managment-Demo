import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface Props {
  title: string;
  description: string;
  children: ReactNode;
  onSave: () => void;
  saving?: boolean;
}

export const SettingsSectionCard = ({
  title,
  description,
  children,
  onSave,
  saving,
}: Props) => (
  <div className="rounded-2xl border border-border-sage bg-white shadow-sm">
    <div className="border-b border-border-sage px-5 py-4">
      <h2 className="font-serif text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-0.5 text-sm text-ink-soft">{description}</p>
    </div>
    <div className="px-5 py-4">{children}</div>
    <div className="flex justify-end border-t border-border-sage px-5 py-3">
      <Button className="rounded-lg px-5 py-2 text-sm" onClick={onSave} isLoading={saving}>
        Save Changes
      </Button>
    </div>
  </div>
);
