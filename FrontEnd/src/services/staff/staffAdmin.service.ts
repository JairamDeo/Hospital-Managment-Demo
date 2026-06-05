import axiosInstance from '../http/axiosInstance';
import type { ApiResponse, HmsStaff } from '@/types/api.types';
import type { StaffFormValues, StaffStats } from '@/types/staff.types';

class StaffAdminService {
  list() {
    return axiosInstance.get<ApiResponse<{ staff: HmsStaff[] }>>('/admin/staff');
  }

  getStats() {
    return axiosInstance.get<ApiResponse<{ stats: StaffStats }>>('/admin/staff/stats/summary');
  }

  get(staffCode: string) {
    return axiosInstance.get<ApiResponse<{ staff: HmsStaff }>>(
      `/admin/staff/${encodeURIComponent(staffCode)}`
    );
  }

  create(values: StaffFormValues) {
    return axiosInstance.post<ApiResponse<{ staff: HmsStaff }>>('/admin/staff', {
      name: values.name.trim(),
      role: values.role,
      title: values.title.trim(),
      shift: values.shift.trim() || '9AM – 5PM',
    });
  }
}

export const staffAdminService = new StaffAdminService();
