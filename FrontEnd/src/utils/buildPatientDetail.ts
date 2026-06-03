import type { HmsPatient } from '@/types/api.types';
import type { PatientDetail } from '@/types/patientDetail.types';
import { hmsToPatient } from '@/utils/patientHelpers';

export interface PatientCareApi {
  vitals: PatientDetail['vitals'];
  activeTreatment?: PatientDetail['activeTreatment'];
  treatmentHistory: PatientDetail['treatmentHistory'];
  appointments: PatientDetail['appointments'];
  labReports: PatientDetail['labReports'];
  invoices: PatientDetail['invoices'];
  documents: PatientDetail['documents'];
}

export const buildPatientDetail = (
  patient: HmsPatient & { gender?: string; bloodGroup?: string; memberSince?: string; city?: string },
  care: PatientCareApi
): PatientDetail => {
  const base = hmsToPatient(patient);
  return {
    ...base,
    gender: patient.gender ?? 'Not recorded',
    bloodGroup: patient.bloodGroup ?? '—',
    memberSince: patient.memberSince ?? '—',
    city: patient.city ?? 'India',
    vitals: care.vitals,
    activeTreatment: care.activeTreatment ?? undefined,
    treatmentHistory: care.treatmentHistory ?? [],
    appointments: care.appointments ?? [],
    labReports: care.labReports ?? [],
    invoices: care.invoices ?? [],
    documents: care.documents ?? [],
  };
};
