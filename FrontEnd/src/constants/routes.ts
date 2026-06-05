const ADMIN = '/admin';

export const ROUTES = {
  // Customer portal
  CUSTOMER_WELCOME: '/',
  CUSTOMER_LOGIN: '/login',
  CUSTOMER_REGISTER: '/register',
  CUSTOMER_VERIFY_OTP: '/verify-otp',
  CUSTOMER_HOME: '/home',
  CUSTOMER_APPOINTMENTS: '/appointments',
  CUSTOMER_PROFILE: '/profile',

  // Admin auth
  ADMIN_LOGIN: '/admin-login',
  ADMIN_FORGOT_PASSWORD: `${ADMIN}/forgot-password`,

  // Admin app
  ADMIN_DASHBOARD: `${ADMIN}/dashboard`,
  ADMIN_PATIENTS: `${ADMIN}/patients`,
  ADMIN_PATIENT_DETAIL: `${ADMIN}/patients/:patientId`,
  ADMIN_APPOINTMENTS: `${ADMIN}/appointments`,
  ADMIN_APPOINTMENT_DETAIL: `${ADMIN}/appointments/:appointmentId`,
  ADMIN_APPOINTMENT_FOLLOWUP: `${ADMIN}/appointments/:appointmentId/follow-up`,
  ADMIN_PANCHAKARMA: `${ADMIN}/panchakarma`,
  ADMIN_PHARMACY: `${ADMIN}/pharmacy`,
  ADMIN_STAFF: `${ADMIN}/staff`,
  ADMIN_STAFF_DETAIL: `${ADMIN}/staff/:staffId`,
  ADMIN_ANALYTICS: `${ADMIN}/analytics`,
  ADMIN_BILLING: `${ADMIN}/billing`,
  ADMIN_INVOICE_DETAIL: `${ADMIN}/billing/:invoiceId`,
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
