export const ROUTES = {
  LOGIN: '/',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  PATIENTS: '/patients',
  PATIENT_DETAIL: '/patients/:patientId',
  APPOINTMENTS: '/appointments',
  APPOINTMENT_DETAIL: '/appointments/:appointmentId',
  PANCHAKARMA: '/panchakarma',
  PHARMACY: '/pharmacy',
  STAFF: '/staff',
  STAFF_DETAIL: '/staff/:staffId',
  ANALYTICS: '/analytics',
  BILLING: '/billing',
  INVOICE_DETAIL: '/billing/:invoiceId',
  SETTINGS: '/settings',
  ACCESS_DENIED: '/access-denied',
} as const;

export const patientDetailPath = (patientId: string) => `/patients/${patientId}`;
export const staffDetailPath = (staffId: string) => `/staff/${staffId}`;
export const invoiceDetailPath = (invoiceId: string) => `/billing/${invoiceId}`;
export const appointmentDetailPath = (appointmentId: string) => `/appointments/${appointmentId}`;
