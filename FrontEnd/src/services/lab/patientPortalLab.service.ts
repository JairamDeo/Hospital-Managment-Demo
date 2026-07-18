import axiosInstance from '../http/axiosInstance';
import type { ApiResponse, MasterItem } from '@/types/api.types';
import type { LabOrder, LabReportItem } from './labAdmin.service';

export interface LabTestMasterItem extends MasterItem {
  category?: string;
  categoryCode?: string;
  categoryName?: string;
}

class PatientPortalLabService {
  listReports() {
    return axiosInstance.get<ApiResponse<{ reports: LabReportItem[] }>>(
      '/patient-portal/lab/reports'
    );
  }

  listOrders() {
    return axiosInstance.get<ApiResponse<{ orders: LabOrder[] }>>('/patient-portal/lab/orders');
  }

  listMasters() {
    return axiosInstance.get<
      ApiResponse<{ categories: MasterItem[]; tests: LabTestMasterItem[] }>
    >('/patient-portal/lab/masters');
  }

  uploadReport(formData: FormData) {
    return axiosInstance.post<ApiResponse<{ report: LabReportItem }>>(
      '/patient-portal/lab/reports/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  }
}

export const patientPortalLabService = new PatientPortalLabService();
