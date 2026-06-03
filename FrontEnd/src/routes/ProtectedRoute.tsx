import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePatientPortalAuth } from '@/hooks/usePatientPortalAuth';
import { PageLoader } from '@/components/ui/Loader';
import { ROUTES } from '@/constants/routes';

export const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.ADMIN_LOGIN} state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

export const AdminPublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (isAuthenticated) {
    return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
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
