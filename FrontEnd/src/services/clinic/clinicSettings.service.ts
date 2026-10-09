import axiosInstance from '../http/axiosInstance';
import type { ApiResponse } from '@/types/api.types';

export interface ClinicSettingsDto {
  name: string;
  patientCodePrefix: string;
  patientCodeFormat: string;
  patientCodePreview: string;
  reassignedPatients?: number;
}

class ClinicSettingsService {
  get() {
    return axiosInstance.get<ApiResponse<{ settings: ClinicSettingsDto }>>(
      '/admin/clinic-settings'
    );
  }

  update(payload: {
    name?: string;
    patientCodePrefix?: string;
    applyToExistingPatients?: boolean;
  }) {
    return axiosInstance.patch<ApiResponse<{ settings: ClinicSettingsDto }>>(
      '/admin/clinic-settings',
      payload
    );
  }
}

export const clinicSettingsService = new ClinicSettingsService();
