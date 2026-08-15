import axiosInstance from '../http/axiosInstance';
import type { ApiResponse } from '@/types/api.types';

export interface LabOrderTest {
  id?: string;
  testCode: string;
  testName: string;
  categoryCode?: string;
  categoryName?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  reportCode?: string;
}

export interface LabOrder {
  _id: string;
  orderCode: string;
  id: string;
  patientCode: string;
  patientName: string;
  prescriptionCode?: string;
  appointmentCode?: string;
  doctorStaffCode?: string;
  doctorName?: string;
  tests: LabOrderTest[];
  status: 'Pending' | 'Partial' | 'Completed' | 'Cancelled';
  createdAt?: string;
}

export interface LabReportItem {
  _id: string;
  reportCode: string;
  id: string;
  patientCode: string;
  patientName: string;
  orderCode?: string;
  testCode?: string;
  testName: string;
  categoryCode?: string;
  categoryName?: string;
  result?: string;
  status: 'Normal' | 'Abnormal' | 'Pending';
  lab?: string;
  labName?: string;
  date?: string;
  reportDate?: string;
  fileUrl?: string;
  fileName?: string;
  source?: 'lab' | 'patient' | 'doctor';
  createdAt?: string;
}

export interface LabStatRow {
  code?: string;
  name: string;
  categoryCode?: string;
  categoryName?: string;
  testCount?: number;
  requested?: number;
  completed?: number;
  reports?: number;
  count?: number;
}

export interface LabStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalReports: number;
  masterTestCount?: number;
  masterCategoryCount?: number;
  categoryStats: LabStatRow[];
  testStats: LabStatRow[];
}

export interface HmsNotificationItem {
  _id: string;
  title: string;
  message: string;
  href?: string;
  type?: string;
  readAt?: string | null;
  createdAt?: string;
}

export interface LabOrderListParams {
  status?: string;
  patientCode?: string;
  search?: string;
  testCode?: string;
  categoryCode?: string;
}

export interface LabReportListParams {
  patientCode?: string;
  categoryCode?: string;
  testCode?: string;
  search?: string;
}

class LabAdminService {
  getStats() {
    return axiosInstance.get<ApiResponse<{ stats: LabStats }>>('/admin/lab/stats/summary');
  }

  listOrders(params?: LabOrderListParams | string) {
    const query =
      typeof params === 'string'
        ? params && params !== 'all'
          ? { status: params }
          : undefined
        : {
            ...(params?.status && params.status !== 'all' ? { status: params.status } : {}),
            ...(params?.patientCode ? { patientCode: params.patientCode } : {}),
            ...(params?.search ? { search: params.search } : {}),
            ...(params?.testCode ? { testCode: params.testCode } : {}),
            ...(params?.categoryCode ? { categoryCode: params.categoryCode } : {}),
          };
    return axiosInstance.get<ApiResponse<{ orders: LabOrder[] }>>('/admin/lab/orders', {
      params: query,
    });
  }

  getOrder(orderCode: string) {
    return axiosInstance.get<ApiResponse<{ order: LabOrder }>>(
      `/admin/lab/orders/${encodeURIComponent(orderCode)}`
    );
  }

  listReports(params?: LabReportListParams) {
    return axiosInstance.get<ApiResponse<{ reports: LabReportItem[] }>>('/admin/lab/reports', {
      params,
    });
  }

  uploadReport(formData: FormData) {
    return axiosInstance.post<ApiResponse<{ report: LabReportItem }>>(
      '/admin/lab/reports/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  }

  listNotifications() {
    return axiosInstance.get<ApiResponse<{ notifications: HmsNotificationItem[] }>>(
      '/admin/lab/notifications'
    );
  }

  markNotificationRead(id: string) {
    return axiosInstance.post<ApiResponse<{ notification: { _id: string; readAt: string } }>>(
      `/admin/lab/notifications/${id}/read`
    );
  }
}

export const labAdminService = new LabAdminService();
