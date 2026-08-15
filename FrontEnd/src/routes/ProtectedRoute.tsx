import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { usePatientPortalAuth } from '@/hooks/usePatientPortalAuth';
import { PageLoader } from '@/components/ui/Loader';
import { ROUTES } from '@/constants/routes';
import { defaultLandingRoute, moduleForPath } from '@/utils/navPermissions';

const isOwnStaffProfilePath = (pathname: string, staffCode?: string) => {
  if (!staffCode) return false;
  const segment = pathname.split('/').filter(Boolean).pop();
  return segment === staffCode || segment === encodeURIComponent(staffCode);
};

export const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { canView, isStaff } = usePermissions();
  const location = useLocation();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.ADMIN_LOGIN} state={{ from: location }} replace />;
  }

  const module = moduleForPath(location.pathname);
  if (module && !canView(module)) {
    const ownProfile =
      module === 'staff' &&
      isStaff &&
      isOwnStaffProfilePath(location.pathname, user?.staffCode);
    if (!ownProfile) {
      return <Navigate to={ROUTES.ADMIN_ACCESS_DENIED} replace />;
    }
  }

  return <>{children}</>;
};

export const AdminPublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <PageLoader />;
  if (isAuthenticated) {
    const isAdmin = user?.accountType === 'admin' || user?.role === 'admin';
    const landing = defaultLandingRoute(user?.permissions, isAdmin, user?.staffCode);
    return <Navigate to={landing} replace />;
  }
  return <>{children}</>;
};

export const CustomerProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = usePatientPortalAuth();
  const location = useLocation();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.CUSTOMER_WELCOME} state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

export const CustomerPublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = usePatientPortalAuth();

  if (isLoading) return <PageLoader />;
  if (isAuthenticated) {
    return <Navigate to={ROUTES.CUSTOMER_HOME} replace />;
  }
  return <>{children}</>;
};

/** @deprecated Use AdminProtectedRoute */
export const ProtectedRoute = AdminProtectedRoute;

/** @deprecated Use AdminPublicOnlyRoute */
export const PublicOnlyRoute = AdminPublicOnlyRoute;
