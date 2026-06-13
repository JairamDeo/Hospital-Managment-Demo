import axiosInstance from '../http/axiosInstance';
import type { ApiResponse, HmsStaff } from '@/types/api.types';
import type { StaffFormValues, StaffStats } from '@/types/staff.types';
import type { StaffCompensationFormValues, StaffCompensationRow } from '@/types/staffCompensation.types';
import { formToCompensationPayload } from '@/utils/staffCompensation.util';

class StaffAdminService {
  list() {
    return axiosInstance.get<ApiResponse<{ staff: HmsStaff[] }>>('/admin/staff');
  }

  getStats() {
    return axiosInstance.get<ApiResponse<{ stats: StaffStats }>>('/admin/staff/stats/summary');
  }

  listCompensation() {
    return axiosInstance.get<ApiResponse<{ rows: StaffCompensationRow[] }>>(
      '/admin/staff/compensation/list'
    );
  }

  get(staffCode: string) {
    return axiosInstance.get<ApiResponse<{ staff: HmsStaff }>>(
      `/admin/staff/${encodeURIComponent(staffCode)}`
    );
  }

  private buildPayload(values: StaffFormValues) {
    return {
      name: values.name.trim(),
      role: values.role,
      title: values.title.trim(),
      shift: values.shift.trim() || '9AM – 5PM',
      qualifications: values.qualifications,
      aadharNumber: values.aadharNumber.replace(/\s/g, ''),
      panNumber: values.panNumber.trim().toUpperCase(),
      registrationNumber: values.registrationNumber.trim(),
    };
  }

  create(values: StaffFormValues) {
    return axiosInstance.post<ApiResponse<{ staff: HmsStaff }>>(
      '/admin/staff',
      this.buildPayload(values)
    );
  }

  update(staffCode: string, values: Partial<StaffFormValues>) {
    const payload: Record<string, unknown> = {};
    if (values.name != null) payload.name = values.name.trim();
    if (values.role != null) payload.role = values.role;
    if (values.title != null) payload.title = values.title.trim();
    if (values.shift != null) payload.shift = values.shift.trim();
    if (values.qualifications != null) payload.qualifications = values.qualifications;
    if (values.aadharNumber != null) payload.aadharNumber = values.aadharNumber.replace(/\s/g, '');
    if (values.panNumber != null) payload.panNumber = values.panNumber.trim().toUpperCase();
    if (values.registrationNumber != null) payload.registrationNumber = values.registrationNumber.trim();
    return axiosInstance.patch<ApiResponse<{ staff: HmsStaff }>>(
      `/admin/staff/${encodeURIComponent(staffCode)}`,
      payload
    );
  }

  updateCompensation(staffCode: string, values: StaffCompensationFormValues) {
    return axiosInstance.patch<ApiResponse<{ row: StaffCompensationRow }>>(
      `/admin/staff/${encodeURIComponent(staffCode)}/compensation`,
      formToCompensationPayload(values)
    );
  }
}

export const staffAdminService = new StaffAdminService();
