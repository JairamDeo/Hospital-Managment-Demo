import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
}

export const PopoverMenu = ({ open, onClose, anchorRef, children, className = '' }: Props) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        menuRef.current?.contains(t) ||
        anchorRef.current?.contains(t)
      ) {
        return;
      }
      onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      className={`absolute right-0 top-full z-50 mt-2 min-w-[180px] overflow-hidden rounded-xl border border-border-sage bg-white py-1 shadow-lg ${className}`}
    >
      {children}
    </div>
  );
};

interface MenuItemProps {
  icon?: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}

export const PopoverMenuItem = ({ icon, label, onClick, active }: MenuItemProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors ${
      active ? 'bg-sage-mist font-medium text-sage-deep' : 'text-ink-soft hover:bg-sage-mist/70 hover:text-ink'
    }`}
  >
    {icon ? <span className="text-ink-ghost">{icon}</span> : null}
    {label}
  </button>
);
