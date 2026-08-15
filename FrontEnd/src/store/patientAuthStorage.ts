import { PATIENT_AUTH_STORAGE_KEY } from '@/constants/constants';
import type { PatientUser } from '@/types/api.types';

export interface StoredPatientAuth {
  token: string;
  patient: PatientUser;
}

export const patientAuthStorage = {
  get: (): StoredPatientAuth | null => {
    try {
      const raw = localStorage.getItem(PATIENT_AUTH_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as StoredPatientAuth;
    } catch {
      return null;
    }
  },
  set: (data: StoredPatientAuth) => {
    localStorage.setItem(PATIENT_AUTH_STORAGE_KEY, JSON.stringify(data));
  },
  clear: () => {
    localStorage.removeItem(PATIENT_AUTH_STORAGE_KEY);
  },
};
