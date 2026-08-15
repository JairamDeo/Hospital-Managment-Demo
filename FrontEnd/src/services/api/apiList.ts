import { API_URLS } from './apiUrls';

/**
 * API registry: name, path, HTTP method, payload shape, auth requirement.
 * Paths are relative to VITE_BACKEND_URL (includes `/api`).
 */
export const API_LIST = {
  HEALTH: {
    name: 'health',
    method: 'GET' as const,
    path: API_URLS.HEALTH,
    payload: null,
    private: false,
  },

  ADMIN_LOGIN: {
    name: 'adminLogin',
    method: 'POST' as const,
    path: API_URLS.ADMIN.LOGIN,
    payload: { email: 'string', password: 'string' },
    private: false,
  },
  ADMIN_ME: {
    name: 'adminMe',
    method: 'GET' as const,
    path: API_URLS.ADMIN.ME,
    payload: null,
    private: true,
  },
  ADMIN_FORGOT_SEND_OTP: {
    name: 'adminForgotSendOtp',
    method: 'POST' as const,
    path: API_URLS.ADMIN.FORGOT_SEND_OTP,
    payload: { mobileNumber: 'string' },
    private: false,
  },
  ADMIN_FORGOT_RESEND_OTP: {
    name: 'adminForgotResendOtp',
    method: 'POST' as const,
    path: API_URLS.ADMIN.FORGOT_RESEND_OTP,
    payload: { mobileNumber: 'string' },
    private: false,
  },
  ADMIN_FORGOT_VERIFY_OTP: {
    name: 'adminForgotVerifyOtp',
    method: 'POST' as const,
    path: API_URLS.ADMIN.FORGOT_VERIFY_OTP,
    payload: { mobileNumber: 'string', otp: 'string' },
    private: false,
  },
  ADMIN_FORGOT_RESET_PASSWORD: {
    name: 'adminForgotResetPassword',
    method: 'POST' as const,
    path: API_URLS.ADMIN.FORGOT_RESET_PASSWORD,
    payload: { resetToken: 'string', newPassword: 'string', confirmPassword: 'string' },
    private: false,
  },
  ADMIN_LOGOUT: {
    name: 'adminLogout',
    method: 'POST' as const,
    path: API_URLS.ADMIN.LOGOUT,
    payload: null,
    private: true,
  },
  ADMIN_SIDEBAR: {
    name: 'adminSidebar',
    method: 'GET' as const,
    path: API_URLS.ADMIN.SIDEBAR,
    payload: null,
    private: true,
  },

  USER_LOGIN: {
    name: 'userLogin',
    method: 'POST' as const,
    path: API_URLS.USER.LOGIN,
    payload: { mobileNumber: 'string', password: 'string' },
    private: false,
  },
  USER_MODULE_LIST: {
    name: 'userModuleList',
    method: 'GET' as const,
    path: API_URLS.USER.MODULE_LIST,
    payload: null,
    private: true,
  },

  PATIENT_REGISTER: {
    name: 'patientRegister',
    method: 'POST' as const,
    path: API_URLS.PATIENT.REGISTER,
    payload: 'object',
    private: false,
  },
} as const;

export type ApiKey = keyof typeof API_LIST;
