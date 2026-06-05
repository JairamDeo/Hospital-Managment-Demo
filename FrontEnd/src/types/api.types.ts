export interface ApiResponse<T = unknown> {
  message: string;
  status_code: number;
  res: T | null;
}

export interface ModulePermission {
  view: boolean;
  edit: boolean;
}

export interface AdminUser {
  _id: string;
  userCode?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  mobileNumber?: string;
  role: string;
  accountType?: 'admin' | 'staff';
  staffRole?: 'Doctor' | 'Therapist' | 'Pharmacist' | 'Support';
  staffCode?: string;
  title?: string;
  permissions?: Record<string, ModulePermission>;
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

export interface HmsStaff {
  _id: string;
  staffCode: string;
  id: string;
  name: string;
  role: 'Doctor' | 'Therapist' | 'Pharmacist' | 'Support';
  title: string;
  dutyStatus: 'On Duty' | 'Off Duty';
  status: 'On Duty' | 'Off Duty';
  statPrimaryValue: number;
  statPrimaryLabel: string;
  todayCount: number;
  todayLabel: string;
  rating: number;
  tags: string[];
  shift: string;
  accountActive?: boolean;
}

export interface HmsAppointment {
  _id: string;
  appointmentCode: string;
  id: string;
  patientCode: string;
  patientId: string;
  patientName: string;
  initials?: string;
  avatarClass?: string;
  staffCode: string;
  doctorId?: string;
  doctorName: string;
  doctor?: string;
  appointmentType: string;
  type: string;
  date: string;
  dateDisplay?: string;
  time: string;
  timeDisplay?: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  adminStatus?: 'Soon' | 'In' | 'Done' | 'Cancelled';
  notes?: string;
  createdBy?: {
    type: 'admin' | 'patient';
    name?: string;
    patientCode?: string;
  };
}

export interface HmsPanchakarmaProgram {
  _id: string;
  programCode: string;
  id: string;
  patientCode: string;
  patientId: string;
  patientName: string;
  initials?: string;
  avatarClass?: string;
  staffCode: string;
  therapistId: string;
  therapistName: string;
  therapy: 'Vamana' | 'Virechana' | 'Basti' | 'Nasya';
  totalDays: number;
  currentDay: number;
  room: string;
  startDate: string;
  startDateDisplay?: string;
  progress: number;
  status: 'Starting' | 'Ongoing' | 'Complete' | 'Cancelled';
}
