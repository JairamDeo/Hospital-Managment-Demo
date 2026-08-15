import type { AdminUser } from './api.types';

export interface AuthState {
  token: string | null;
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type ForgotPasswordStep = 'mobile' | 'otp' | 'password';
