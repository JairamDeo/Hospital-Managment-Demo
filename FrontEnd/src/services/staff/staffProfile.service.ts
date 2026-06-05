import axiosInstance from '../http/axiosInstance';
import type { ApiResponse } from '@/types/api.types';
import type {
  StaffActivityRecord,
  StaffDocumentRecord,
  StaffLeaveRecord,
} from '@/types/staffProfile.types';

class StaffProfileService {
  listActivity(staffCode: string) {
    return axiosInstance.get<ApiResponse<{ activity: StaffActivityRecord[] }>>(
      `/admin/staff/${encodeURIComponent(staffCode)}/activity`
    );
  }

  checkIn(staffCode: string) {
    return axiosInstance.post<ApiResponse<{ activity: StaffActivityRecord }>>(
      `/admin/staff/${encodeURIComponent(staffCode)}/activity/check-in`
    );
  }

  checkOut(staffCode: string) {
    return axiosInstance.post<ApiResponse<{ activity: StaffActivityRecord }>>(
      `/admin/staff/${encodeURIComponent(staffCode)}/activity/check-out`
    );
  }

  listDocuments(staffCode: string) {
    return axiosInstance.get<ApiResponse<{ documents: StaffDocumentRecord[] }>>(
      `/admin/staff/${encodeURIComponent(staffCode)}/documents`
    );
  }

  uploadDocument(staffCode: string, file: File, title?: string) {
    const form = new FormData();
    form.append('file', file);
    if (title?.trim()) form.append('title', title.trim());
    return axiosInstance.post<ApiResponse<{ document: StaffDocumentRecord }>>(
      `/admin/staff/${encodeURIComponent(staffCode)}/documents`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  }

  downloadDocument(staffCode: string, docId: string) {
    return axiosInstance.get(
      `/admin/staff/${encodeURIComponent(staffCode)}/documents/${docId}/download`,
      { responseType: 'blob' }
    );
  }

  listLeave(staffCode: string) {
    return axiosInstance.get<ApiResponse<{ leave: StaffLeaveRecord[] }>>(
      `/admin/staff/${encodeURIComponent(staffCode)}/leave`
    );
  }

  applyLeave(
    staffCode: string,
    payload: { leaveType: 'Casual' | 'Sick'; startDate: string; endDate: string }
  ) {
    return axiosInstance.post<ApiResponse<{ leave: StaffLeaveRecord }>>(
      `/admin/staff/${encodeURIComponent(staffCode)}/leave`,
      payload
    );
  }

  previewLeaveDays(startDate: string, endDate: string) {
    return axiosInstance.get<ApiResponse<{ days: number }>>('/admin/staff/leave/preview-days', {
      params: { startDate, endDate },
    });
  }

  approveLeave(leaveId: string) {
    return axiosInstance.patch<ApiResponse<{ leave: StaffLeaveRecord }>>(
      `/admin/staff/leave/${leaveId}/approve`
    );
  }

  rejectLeave(leaveId: string) {
    return axiosInstance.patch<ApiResponse<{ leave: StaffLeaveRecord }>>(
      `/admin/staff/leave/${leaveId}/reject`
    );
  }
}

export const staffProfileService = new StaffProfileService();
