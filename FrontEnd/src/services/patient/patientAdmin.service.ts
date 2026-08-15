import axiosInstance from '../http/axiosInstance';
import type { ApiResponse, HmsPatient } from '@/types/api.types';
import type { PatientFormValues, PatientProfileFormValues, PatientStats } from '@/types/patient.types';
import type { PatientCareApi } from '@/utils/buildPatientDetail';
import type { PatientClinicalProfile } from '@/types/patientClinical.types';
import type { PatientTreatmentHistory } from '@/types/patientDetail.types';
import type { PatientPrescriptionPdf } from '@/types/patientPrescription.types';
import type { StructuredPrescription, StructuredPrescriptionPayload } from '@/types/structuredPrescription.types';
import type { PatientVitalsEntry, PatientVitalsPayload } from '@/types/patientVitals.types';
import type {
  PatientInsuranceFormValues,
  PatientInsuranceRow,
  PatientInsuranceStats,
} from '@/types/patientInsurance.types';
import { clinicalPayloadForApi } from '@/utils/patientClinicalHelpers';
import { formToInsurancePayload } from '@/utils/patientInsurance.util';

class PatientAdminService {
  list() {
    return axiosInstance.get<ApiResponse<{ patients: HmsPatient[] }>>('/admin/patients');
  }

  getStats() {
    return axiosInstance.get<ApiResponse<{ stats: PatientStats }>>('/admin/patients/stats/summary');
  }

  listInsurance() {
    return axiosInstance.get<ApiResponse<{ rows: PatientInsuranceRow[] }>>(
      '/admin/patients/insurance/list'
    );
  }

  getInsuranceStats() {
    return axiosInstance.get<ApiResponse<{ stats: PatientInsuranceStats }>>(
      '/admin/patients/insurance/stats/summary'
    );
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

  getTreatmentHistory(patientCode: string) {
    return axiosInstance.get<ApiResponse<PatientTreatmentHistory>>(
      `/admin/patients/${encodeURIComponent(patientCode)}/treatment-history`
    );
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

  sendStructuredPrescriptionWhatsApp(patientCode: string, prescriptionCode: string) {
    return axiosInstance.post<
      ApiResponse<{
        whatsappSent?: boolean;
        emailSent?: boolean;
        whatsapp?: { skipped?: boolean; reason?: string; sent?: boolean; patientMobileMasked?: string; prescriptionCode?: string };
        email?: { skipped?: boolean; reason?: string };
      }>
    >(
      `/admin/patients/${encodeURIComponent(patientCode)}/structured-prescriptions/${encodeURIComponent(prescriptionCode)}/whatsapp`
    );
  }

  sendUploadedPrescriptionWhatsApp(patientCode: string, prescriptionId: string) {
    return axiosInstance.post<
      ApiResponse<{
        whatsappSent?: boolean;
        emailSent?: boolean;
        whatsapp?: { skipped?: boolean; reason?: string; sent?: boolean; patientMobileMasked?: string; prescriptionId?: string };
        email?: { skipped?: boolean; reason?: string };
      }>
    >(
      `/admin/patients/${encodeURIComponent(patientCode)}/prescriptions/${encodeURIComponent(prescriptionId)}/whatsapp`
    );
  }

  updateInsurance(patientCode: string, values: PatientInsuranceFormValues) {
    return axiosInstance.patch<ApiResponse<{ row: PatientInsuranceRow }>>(
      `/admin/patients/${encodeURIComponent(patientCode)}/insurance`,
      formToInsurancePayload(values)
    );
  }

  listAiConsultationSamples() {
    return axiosInstance.get<ApiResponse<{ samples: AiConsultationSample[] }>>(
      '/admin/patients/ai-consultation/samples'
    );
  }

  listAiConsultationSummaries(patientCode: string) {
    return axiosInstance.get<ApiResponse<{ summaries: AiConsultationSummary[] }>>(
      `/admin/patients/${encodeURIComponent(patientCode)}/ai-consultation/summaries`
    );
  }

  generateAiConsultation(
    patientCode: string,
    payload: {
      sampleId?: string;
      discussionText?: string;
      appointmentCode?: string;
      language?: 'en' | 'hi' | 'both';
    }
  ) {
    return axiosInstance.post<ApiResponse<{ summary: AiConsultationSummary }>>(
      `/admin/patients/${encodeURIComponent(patientCode)}/ai-consultation`,
      payload
    );
  }

  ensureAiConsultationHindi(patientCode: string, summaryCode: string) {
    return axiosInstance.post<ApiResponse<{ summary: AiConsultationSummary }>>(
      `/admin/patients/${encodeURIComponent(patientCode)}/ai-consultation/${encodeURIComponent(summaryCode)}/hindi`
    );
  }
}

export interface AiConsultationSample {
  id: string;
  title: string;
  preview: string;
  discussionText: string;
}

export interface AiConsultationLocalized {
  clinicalSummary?: string;
  chiefComplaint?: string;
  assessment?: string;
  historyConsidered?: string[];
  suggestedTests?: Array<{ name?: string; reason?: string; priority?: string }>;
  suggestedMedicines?: Array<{
    name?: string;
    type?: string;
    rationale?: string;
    caution?: string;
  }>;
  redFlags?: string[];
  followUpAdvice?: string;
  disclaimer?: string;
}

export interface AiConsultationSummary extends AiConsultationLocalized {
  _id: string;
  summaryCode: string;
  patientCode: string;
  discussionSource?: string;
  sampleId?: string;
  discussionText?: string;
  model?: string;
  outputLanguage?: 'en' | 'hi' | 'both';
  hasHindi?: boolean;
  contentEn?: AiConsultationLocalized | null;
  contentHi?: AiConsultationLocalized | null;
  tokenUsage?: {
    promptTokens?: number;
    candidatesTokens?: number;
    totalTokens?: number;
  };
  createdAt?: string;
}

export const patientAdminService = new PatientAdminService();
