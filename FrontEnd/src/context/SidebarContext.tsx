import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface SidebarContextValue {
  isMobileOpen: boolean;
  isCollapsed: boolean;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMobile: () => void;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const openMobile = useCallback(() => setIsMobileOpen(true), []);
  const closeMobile = useCallback(() => setIsMobileOpen(false), []);
  const toggleMobile = useCallback(() => setIsMobileOpen((v) => !v), []);
  const toggleCollapsed = useCallback(() => setIsCollapsed((v) => !v), []);

  const value = useMemo(
    () => ({
      isMobileOpen,
      isCollapsed,
      openMobile,
      closeMobile,
      toggleMobile,
      toggleCollapsed,
    }),
    [isMobileOpen, isCollapsed, openMobile, closeMobile, toggleMobile, toggleCollapsed]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

export const useSidebar = () => {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
};
