/**
 * Must include `/api` suffix, e.g. `http://localhost:6060/api`
 * Default `/api` works for Vite proxy (dev) and same-origin Vercel rewrites (prod).
 * On Vercel, leave VITE_BACKEND_URL unset or set it to `/api`.
 */
const rawBase = (import.meta.env.VITE_BACKEND_URL ?? '/api').replace(/\/$/, '');
export const API_BASE_URL = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;

export const AUTH_STORAGE_KEY = 'hms_admin_auth';
export const PATIENT_AUTH_STORAGE_KEY = 'hms_patient_auth';

export const OTP_LENGTH = 4;
/** Fallback only — actual timers come from API (OTP_EXPIRY_SECONDS in backend .env) */
export const OTP_VALIDITY_SECONDS = 120;
export const OTP_RESEND_SECONDS = 30;

export const TOAST_DURATION_MS = 10000;

export const APP_NAME = 'AYURVEDA Health';
