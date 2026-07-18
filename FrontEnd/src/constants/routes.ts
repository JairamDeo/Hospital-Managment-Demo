const ADMIN = '/admin';

export const ROUTES = {
  // Customer portal
  CUSTOMER_WELCOME: '/',
  CUSTOMER_LOGIN: '/login',
  CUSTOMER_REGISTER: '/register',
  CUSTOMER_VERIFY_OTP: '/verify-otp',
  CUSTOMER_HOME: '/home',
  CUSTOMER_APPOINTMENTS: '/appointments',
  CUSTOMER_REPORTS: '/reports',
  CUSTOMER_PROFILE: '/profile',

  // Admin auth
  ADMIN_LOGIN: '/admin-login',
  ADMIN_FORGOT_PASSWORD: `${ADMIN}/forgot-password`,

  // Admin app
  ADMIN_DASHBOARD: `${ADMIN}/dashboard`,
  ADMIN_PATIENTS: `${ADMIN}/patients`,
  ADMIN_PATIENT_INSURANCE: `${ADMIN}/health-insurance`,
  ADMIN_PATIENT_DETAIL: `${ADMIN}/patients/:patientId`,
  ADMIN_APPOINTMENTS: `${ADMIN}/appointments`,
  ADMIN_APPOINTMENT_DETAIL: `${ADMIN}/appointments/:appointmentId`,
  ADMIN_APPOINTMENT_FOLLOWUP: `${ADMIN}/appointments/:appointmentId/follow-up`,
  ADMIN_PANCHAKARMA: `${ADMIN}/panchakarma`,
  ADMIN_IPD: `${ADMIN}/ipd`,
  ADMIN_LAB: `${ADMIN}/lab`,
  ADMIN_IPD_ADMISSION_DETAIL: `${ADMIN}/ipd/admissions/:admissionCode`,
  ADMIN_PANCHAKARMA_PROGRAM_ATTEND: `${ADMIN}/panchakarma/programs/:programCode/attend`,
  ADMIN_PHARMACY: `${ADMIN}/pharmacy`,
  ADMIN_STAFF: `${ADMIN}/staff`,
  ADMIN_STAFF_COMPENSATION: `${ADMIN}/staff/compensation`,
  ADMIN_STAFF_DETAIL: `${ADMIN}/staff/:staffId`,
  ADMIN_ANALYTICS: `${ADMIN}/analytics`,
  ADMIN_BILLING: `${ADMIN}/billing`,
  ADMIN_BILLING_MEDICINE: `${ADMIN}/billing/medicine`,
  ADMIN_BILLING_CONSULTATION: `${ADMIN}/billing/consultation`,
  ADMIN_BILLING_PANCHAKARMA: `${ADMIN}/billing/panchakarma`,
  ADMIN_INVOICE_DETAIL: `${ADMIN}/billing/:invoiceId`,
  ADMIN_PRESCRIPTION: `${ADMIN}/prescriptions`,
  ADMIN_PANCHAKARMA_TREATMENT: `${ADMIN}/panchakarma/appointments/:appointmentId/treatment`,
  ADMIN_SETTINGS: `${ADMIN}/settings`,
  ADMIN_MASTER_DATA: `${ADMIN}/master-data`,
  ADMIN_ACCESS_DENIED: `${ADMIN}/access-denied`,
} as const;

export const patientDetailPath = (patientId: string) =>
  `${ADMIN}/patients/${encodeURIComponent(patientId)}`;
export const staffDetailPath = (staffId: string) => `${ADMIN}/staff/${staffId}`;
export const invoiceDetailPath = (invoiceId: string) => `${ADMIN}/billing/${invoiceId}`;
export const appointmentDetailPath = (appointmentId: string) =>
  `${ADMIN}/appointments/${encodeURIComponent(appointmentId)}`;
export const appointmentFollowUpPath = (appointmentId: string) =>
  `${ADMIN}/appointments/${encodeURIComponent(appointmentId)}/follow-up`;
export const prescriptionPath = (patientCode: string, appointmentCode?: string) => {
  const params = new URLSearchParams({ patientCode });
  if (appointmentCode) params.set('appointmentCode', appointmentCode);
  return `${ADMIN}/prescriptions?${params.toString()}`;
};
export const panchakarmaTreatmentPath = (appointmentId: string) =>
  `${ADMIN}/panchakarma/appointments/${encodeURIComponent(appointmentId)}/treatment`;
export const programAttendPath = (programCode: string) =>
  `${ADMIN}/panchakarma/programs/${encodeURIComponent(programCode)}/attend`;
export const ipdAdmissionDetailPath = (admissionCode: string) =>
  `${ADMIN}/ipd/admissions/${encodeURIComponent(admissionCode)}`;
