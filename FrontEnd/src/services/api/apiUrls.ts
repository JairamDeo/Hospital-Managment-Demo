/**
 * All API paths (relative to VITE_BACKEND_URL, which must end with `/api`).
 * Example: base `http://localhost:6060/api` + `/admin/login` → full URL.
 */
export const API_URLS = {
  HEALTH: '/health',

  ADMIN: {
    LOGIN: '/admin/login',
    ME: '/admin/me',
    FORGOT_SEND_OTP: '/admin/forgot-password/send-otp',
    FORGOT_RESEND_OTP: '/admin/forgot-password/resend-otp',
    FORGOT_VERIFY_OTP: '/admin/forgot-password/verify-otp',
    FORGOT_RESET_PASSWORD: '/admin/forgot-password/reset-password',
    // Reserved for future routes
    LOGOUT: '/admin/logout',
    SIDEBAR: '/admin/sidebar',
  },

  USER: {
    LOGIN: '/user/user-login',
    REGISTER: '/user/user-register',
    MODULE_LIST: '/user/module-list',
    POST_ACCESS_MODULE: '/user/post-access-module',
  },

  PATIENT: {
    REGISTER: '/patient/patient-register',
  },
} as const;

export type ApiUrls = typeof API_URLS;
