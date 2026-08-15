import axiosInstance from '../http/axiosInstance';
import type { ApiResponse } from '@/types/api.types';
import type { RbacRoleConfig, StaffRole, RbacPermissions } from '@/types/rbac.types';

class RbacAdminService {
  list() {
    return axiosInstance.get<ApiResponse<{ configs: RbacRoleConfig[] }>>('/admin/rbac');
  }

  update(role: StaffRole, modules: RbacPermissions) {
    return axiosInstance.patch<ApiResponse<{ config: RbacRoleConfig }>>(`/admin/rbac/${role}`, {
      modules,
    });
  }
}

export const rbacAdminService = new RbacAdminService();
