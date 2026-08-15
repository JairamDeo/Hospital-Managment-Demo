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
  staffRole?: 'Doctor' | 'Therapist' | 'Support' | 'Lab';
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

export interface PharmacySpoonItem {
  _id: string;
  code: string;
  name: string;
  grams: number;
  isDefault?: boolean;
  active?: boolean;
}

export interface MasterItem {
  _id: string;
  code: string;
  name: string;
  active?: boolean;
}

export interface RoomMasterItem extends MasterItem {
  roomNumber: string;
  roomType: 'IPD' | 'Panchakarma';
  capacity: number;
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
  role: 'Doctor' | 'Therapist' | 'Support' | 'Lab';
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
  email?: string;
  accountActive?: boolean;
  consultationFee?: number;
  compensation?: {
    basicSalary: number;
    hra: number;
    dearnessAllowance: number;
    specialAllowance: number;
    transportAllowance: number;
    medicalAllowance: number;
    otherAllowances: number;
    pfDeduction: number;
    professionalTax: number;
    otherDeductions: number;
  };
  grossMonthly?: number;
  totalDeductions?: number;
  netMonthly?: number;
  qualifications?: { level: string; degree: string }[];
  registrationNumber?: string;
  aadharNumber?: string;
  panNumber?: string;
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
  timeSlot?: string;
  timeDisplay?: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  adminStatus?: 'Soon' | 'In' | 'Done' | 'Cancelled';
  notes?: string;
  createdBy?: {
    type: 'admin' | 'patient';
    name?: string;
    patientCode?: string;
  };
  createdAt?: string;
  attendedAt?: string;
  attendedBy?: { type: string; name?: string; staffCode?: string };
  followUpDate?: string | null;
  followUpDateDisplay?: string | null;
  followUpTimeSlot?: string | null;
  followUpTimeDisplay?: string | null;
  followUpNotes?: string;
  visitNotes?: string;
  consultationFeeCharged?: number | null;
  consultationFeeExpected?: number | null;
  consultationInvoiceCode?: string;
  paymentStatus?: 'not_required' | 'unpaid' | 'paid';
  followUpAddedBy?: { type: string; name?: string; staffCode?: string };
  followUpAddedAt?: string;
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
  treatmentName?: string;
  totalFees?: number;
  amountPaid?: number;
  appointmentCode?: string;
  totalDays: number;
  currentDay: number;
  room: string;
  startDate: string;
  startDateDisplay?: string;
  progress: number;
  status: 'Starting' | 'Ongoing' | 'Complete' | 'Cancelled';
  needsAttend?: boolean;
  dailySessions?: Array<{
    id: string;
    dayNumber: number;
    sessionDate?: string | null;
    time: string;
    duration: string;
    panchakarmaType: string;
    medicineContent: string;
  }>;
}
