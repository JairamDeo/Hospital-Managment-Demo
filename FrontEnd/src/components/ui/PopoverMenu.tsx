import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
  /** Align menu edge to anchor: start = left, end = right (default) */
  align?: 'start' | 'end';
}

export const PopoverMenu = ({
  open,
  onClose,
  anchorRef,
  children,
  className = '',
  align = 'end',
}: Props) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const computePosition = (menuWidth = 220) => {
    const anchor = anchorRef.current;
    if (!anchor) return null;

    const rect = anchor.getBoundingClientRect();
    const gap = 8;
    const padding = 8;
    const width = menuRef.current?.offsetWidth ?? menuWidth;

    let left = align === 'start' ? rect.left : rect.right - width;
    left = Math.max(padding, Math.min(left, window.innerWidth - width - padding));

    return { top: rect.bottom + gap, left };
  };

  const updatePosition = () => {
    const next = computePosition();
    if (next) setPosition(next);
  };

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(raf);
  }, [open, align, anchorRef, children]);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => updatePosition();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [open, align, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
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

  const coords = position ?? computePosition();
  if (!coords) return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      style={{ position: 'fixed', top: coords.top, left: coords.left, zIndex: 250 }}
      className={`min-w-[200px] max-w-[min(280px,calc(100vw-16px))] overflow-hidden rounded-xl border border-border-sage bg-white py-1 shadow-lg ${className}`}
    >
      {children}
    </div>,
    document.body
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
