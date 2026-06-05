import axios from 'axios';
import { API_BASE_URL, AUTH_STORAGE_KEY, PATIENT_AUTH_STORAGE_KEY } from '@/constants/constants';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

const readToken = (key: string) => {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const { token } = JSON.parse(raw) as { token?: string };
    return token ?? null;
  } catch {
    return null;
  }
};

const isPublicAuthRequest = (url: string) =>
  url.includes('/admin/login') ||
  url.includes('/admin/forgot-password') ||
  url.includes('/patient-portal/login') ||
  url.includes('/patient-portal/register') ||
  url.includes('/patient-portal/verify-otp');

axiosInstance.interceptors.request.use((config) => {
  const url = config.url ?? '';
  if (isPublicAuthRequest(url)) {
    return config;
  }

  const isPatientPortalApi = url.startsWith('/patient-portal');
  const token = isPatientPortalApi
    ? readToken(PATIENT_AUTH_STORAGE_KEY)
    : readToken(AUTH_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => Promise.reject(error)
);

export default axiosInstance;
