import axiosInstance from '../http/axiosInstance';
import type { ApiResponse } from '@/types/api.types';
import type {
  AdmitPatientFormValues,
  CaseNoteFormValues,
  DischargeFormValues,
  IpdAdmission,
  IpdRoom,
  IpdStats,
} from '@/types/ipd.types';

class IpdAdminService {
  listAdmissions(status?: 'Admitted' | 'Discharged') {
    const query = status ? `?status=${status}` : '';
    return axiosInstance.get<ApiResponse<{ admissions: IpdAdmission[] }>>(
      `/admin/ipd/admissions${query}`
    );
  }

  getStats() {
    return axiosInstance.get<ApiResponse<{ stats: IpdStats }>>('/admin/ipd/stats');
  }

  listRooms() {
    return axiosInstance.get<ApiResponse<{ rooms: IpdRoom[] }>>('/admin/ipd/rooms');
  }

  getAdmission(admissionCode: string) {
    return axiosInstance.get<ApiResponse<{ admission: IpdAdmission }>>(
      `/admin/ipd/admissions/${encodeURIComponent(admissionCode)}`
    );
  }

  admit(values: AdmitPatientFormValues) {
    return axiosInstance.post<ApiResponse<{ admission: IpdAdmission }>>('/admin/ipd/admissions', {
      patientCode: values.patientId,
      roomCode: values.roomCode,
      staffCode: values.doctorId,
      admittedAt: values.admittedAt,
      expectedDischargeAt: values.expectedDischargeAt || null,
      diagnosis: values.diagnosis,
      chiefComplaint: values.chiefComplaint,
    });
  }

  addCaseNote(admissionCode: string, values: CaseNoteFormValues) {
    return axiosInstance.post<ApiResponse<{ admission: IpdAdmission }>>(
      `/admin/ipd/admissions/${encodeURIComponent(admissionCode)}/case-notes`,
      {
        treatmentGiven: values.treatmentGiven,
        medicines: values.medicines,
        observations: values.observations,
        bpSystolic: values.bpSystolic,
        bpDiastolic: values.bpDiastolic,
        pulse: values.pulse,
        spo2: values.spo2,
      }
    );
  }

  discharge(admissionCode: string, values: DischargeFormValues) {
    return axiosInstance.post<ApiResponse<{ admission: IpdAdmission }>>(
      `/admin/ipd/admissions/${encodeURIComponent(admissionCode)}/discharge`,
      {
        ...values,
        followUpDate: values.followUpDate || null,
      }
    );
  }
}

export const ipdAdminService = new IpdAdminService();
