import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { RbacModuleKey } from '@/types/rbac.types';

export const usePermissions = () => {
  const { user } = useAuth();

  return useMemo(() => {
    const isAdmin = user?.accountType === 'admin' || user?.role === 'admin';
    const permissions = user?.permissions ?? {};
    const staffCode = user?.staffCode;
    const staffRole = user?.staffRole;

    const canView = (module: RbacModuleKey) => Boolean(permissions[module]?.view);

    const canEdit = (module: RbacModuleKey) => Boolean(permissions[module]?.edit);

    const canCreatePrescription =
      staffRole === 'Doctor' && Boolean(permissions.prescriptions?.edit);

    return {
      isAdmin,
      isStaff: !isAdmin && Boolean(staffCode),
      staffCode,
      staffRole,
      canView,
      canEdit,
      canCreatePrescription,
    };
  }, [user]);
};
