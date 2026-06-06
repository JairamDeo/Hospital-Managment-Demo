import axiosInstance from '../http/axiosInstance';
import type { ApiResponse, HmsPatient } from '@/types/api.types';
import type { PatientFormValues, PatientProfileFormValues, PatientStats } from '@/types/patient.types';
import type { PatientCareApi } from '@/utils/buildPatientDetail';
import type { PatientClinicalProfile } from '@/types/patientClinical.types';
import type { PatientPrescriptionPdf } from '@/types/patientPrescription.types';
import type { StructuredPrescription, StructuredPrescriptionPayload } from '@/types/structuredPrescription.types';
import type { PatientVitalsEntry, PatientVitalsPayload } from '@/types/patientVitals.types';
import { clinicalPayloadForApi } from '@/utils/patientClinicalHelpers';

class PatientAdminService {
  list() {
    return axiosInstance.get<ApiResponse<{ patients: HmsPatient[] }>>('/admin/patients');
  }

  getStats() {
    return axiosInstance.get<ApiResponse<{ stats: PatientStats }>>('/admin/patients/stats/summary');
  }

  getOverview(patientCode: string) {
    return axiosInstance.get<
      ApiResponse<{
        patient: HmsPatient & {
          gender?: string;
          bloodGroup?: string;
          memberSince?: string;
          city?: string;
        };
        care: PatientCareApi;
        clinical: PatientClinicalProfile;
      }>
    >(`/admin/patients/${encodeURIComponent(patientCode)}/overview`);
  }

  get(patientCode: string) {
    return axiosInstance.get<ApiResponse<{ patient: HmsPatient }>>(
      `/admin/patients/${encodeURIComponent(patientCode)}`
    );
  }

  create(values: PatientFormValues) {
    const payload: Record<string, unknown> = {
      name: values.name,
      email: values.email || undefined,
      mobileNumber: values.mobile.replace(/\D/g, '').slice(0, 10),
      age: values.age === '' ? 0 : values.age,
      prakritiId: values.prakritiId || undefined,
      lastVisit: values.lastVisit,
      recordStatus: values.status,
    };
    if (values.treatmentId?.trim()) {
      payload.treatmentId = values.treatmentId;
    }
    return axiosInstance.post<ApiResponse<{ patient: HmsPatient }>>('/admin/patients', payload);
  }

  update(patientCode: string, values: PatientFormValues) {
    return axiosInstance.patch<ApiResponse<{ patient: HmsPatient }>>(
      `/admin/patients/${encodeURIComponent(patientCode)}`,
      {
        name: values.name,
        email: values.email || undefined,
        mobileNumber: values.mobile.replace(/\D/g, '').slice(0, 10),
        age: values.age === '' ? 0 : values.age,
        prakritiId: values.prakritiId || null,
        treatmentId: values.treatmentId,
        lastVisit: values.lastVisit,
        recordStatus: values.status,
      }
    );
  }

  updateProfile(patientCode: string, values: PatientProfileFormValues) {
    return axiosInstance.patch<ApiResponse<{ patient: HmsPatient }>>(
      `/admin/patients/${encodeURIComponent(patientCode)}`,
      {
        name: values.name.trim(),
        email: values.email.trim() || null,
        mobileNumber: values.mobile.replace(/\D/g, '').slice(0, 10),
        age: values.age === '' ? undefined : values.age,
        gender: values.gender,
        bloodGroup: values.bloodGroup.trim(),
        city: values.city.trim() || 'India',
        prakritiId: values.prakritiId || null,
        treatmentId: values.treatmentId,
        recordStatus: values.status,
      }
    );
  }

  getClinical(patientCode: string) {
    return axiosInstance.get<
      ApiResponse<{ patientCode: string; clinical: PatientClinicalProfile }>
    >(`/admin/patients/${encodeURIComponent(patientCode)}/clinical`);
  }

  updateClinical(patientCode: string, clinical: PatientClinicalProfile) {
    return axiosInstance.patch<
      ApiResponse<{ patientCode: string; clinical: PatientClinicalProfile }>
    >(`/admin/patients/${encodeURIComponent(patientCode)}/clinical`, clinicalPayloadForApi(clinical));
  }

  listPrescriptions(patientCode: string) {
    return axiosInstance.get<ApiResponse<{ prescriptions: PatientPrescriptionPdf[] }>>(
      `/admin/patients/${encodeURIComponent(patientCode)}/prescriptions`
    );
  }

  uploadPrescription(patientCode: string, file: File, title?: string) {
    const form = new FormData();
    form.append('file', file);
    if (title?.trim()) form.append('title', title.trim());
    return axiosInstance.post<ApiResponse<{ prescription: PatientPrescriptionPdf }>>(
      `/admin/patients/${encodeURIComponent(patientCode)}/prescriptions`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  }

  deletePrescription(patientCode: string, prescriptionId: string) {
    return axiosInstance.delete<ApiResponse<{ deleted: boolean }>>(
      `/admin/patients/${encodeURIComponent(patientCode)}/prescriptions/${prescriptionId}`
    );
  }

  async fetchPrescriptionPdfBlob(patientCode: string, prescriptionId: string): Promise<Blob> {
    const res = await axiosInstance.get<Blob>(
      `/admin/patients/${encodeURIComponent(patientCode)}/prescriptions/${prescriptionId}/view`,
      { responseType: 'blob' }
    );
    const contentType = String(res.headers['content-type'] ?? '');
    if (contentType.includes('application/json')) {
      const text = await (res.data as Blob).text();
      try {
        const body = JSON.parse(text) as { message?: string };
        throw new Error(body.message || 'Could not load PDF.');
      } catch (e) {
        if (e instanceof Error && e.message !== 'Could not load PDF.') throw e;
        throw new Error('Could not load PDF.');
      }
    }
    return res.data;
  }

  listVitalsHistory(patientCode: string) {
    return axiosInstance.get<ApiResponse<{ vitalsHistory: PatientVitalsEntry[] }>>(
      `/admin/patients/${encodeURIComponent(patientCode)}/vitals`
    );
  }

  addVitals(patientCode: string, payload: PatientVitalsPayload) {
    return axiosInstance.post<ApiResponse<{ vitalsHistory: PatientVitalsEntry[] }>>(
      `/admin/patients/${encodeURIComponent(patientCode)}/vitals`,
      payload
    );
  }

  listStructuredPrescriptions(patientCode: string) {
    return axiosInstance.get<ApiResponse<{ prescriptions: StructuredPrescription[] }>>(
      `/admin/patients/${encodeURIComponent(patientCode)}/structured-prescriptions`
    );
  }

  createStructuredPrescription(patientCode: string, payload: StructuredPrescriptionPayload) {
    return axiosInstance.post<ApiResponse<{ prescription: StructuredPrescription }>>(
      `/admin/patients/${encodeURIComponent(patientCode)}/structured-prescriptions`,
      payload
    );
  }

  async fetchStructuredPrescriptionPdfBlob(
    patientCode: string,
    prescriptionCode: string,
    audience: 'patient' | 'staff' = 'staff'
  ): Promise<Blob> {
    const res = await axiosInstance.get<Blob>(
      `/admin/patients/${encodeURIComponent(patientCode)}/structured-prescriptions/${encodeURIComponent(prescriptionCode)}/pdf`,
      { params: { audience }, responseType: 'blob' }
    );
    const contentType = String(res.headers['content-type'] ?? '');
    if (contentType.includes('application/json')) {
      const text = await (res.data as Blob).text();
      try {
        const body = JSON.parse(text) as { message?: string };
        throw new Error(body.message || 'Could not load PDF.');
      } catch (e) {
        if (e instanceof Error && e.message !== 'Could not load PDF.') throw e;
        throw new Error('Could not load PDF.');
      }
    }
    return res.data;
  }
}

export const patientAdminService = new PatientAdminService();
