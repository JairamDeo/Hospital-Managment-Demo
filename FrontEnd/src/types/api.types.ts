export interface ApiResponse<T = unknown> {
  message: string;
  status_code: number;
  res: T | null;
}

export interface AdminUser {
  _id: string;
  userCode: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  mobileNumber: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: AdminUser;
}

export interface OtpMeta {
  expiresInSeconds: number;
  resendAfterSeconds: number;
}

export interface VerifyOtpResponse {
  resetToken: string;
}

export interface MasterItem {
  _id: string;
  code: string;
  name: string;
  active?: boolean;
}

export interface PatientUser {
  _id: string;
  patientCode: string;
  name: string;
  email: string;
  mobileNumber: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  prakritiId?: string | null;
  prakritiName?: string | null;
  prakriti?: string | null;
  treatmentId?: string | null;
  treatmentName?: string | null;
  treatment?: string | null;
  recordStatus?: string;
  createdByAdmin?: boolean;
  accountActive?: boolean;
}

export interface PatientUpdateProfilePayload {
  name?: string;
  email?: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  prakritiId?: string | null;
  treatmentId?: string | null;
}

export interface PatientLoginResponse {
  token: string;
  patient: PatientUser;
}

export interface PatientRegisterPayload {
  name: string;
  email?: string;
  mobileNumber: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  prakritiId?: string;
  treatmentId?: string;
}

export interface HmsPatient {
  _id: string;
  patientCode: string;
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  mobile: string;
  age: number;
  gender?: string;
  prakritiId: string | null;
  prakritiName: string | null;
  prakriti: string | null;
  treatmentId: string | null;
  treatmentName: string | null;
  treatment: string | null;
  lastVisit?: string;
  recordStatus: string;
  status: string;
  createdByAdmin?: boolean;
}
