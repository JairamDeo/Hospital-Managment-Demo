import axiosInstance from '../http/axiosInstance';
import type { ApiResponse, LoginResponse, OtpMeta, VerifyOtpResponse } from '@/types/api.types';

class AuthService {
  private readonly _url = {
    LOGIN: '/admin/login',
    ME: '/admin/me',
    LOGOUT: '/admin/logout',
    SIDEBAR: '/admin/sidebar',
    FORGOT_SEND_OTP: '/admin/forgot-password/send-otp',
    FORGOT_RESEND_OTP: '/admin/forgot-password/resend-otp',
    FORGOT_VERIFY_OTP: '/admin/forgot-password/verify-otp',
    FORGOT_RESET_PASSWORD: '/admin/forgot-password/reset-password',
  } as const;

  login(email: string, password: string) {
    return axiosInstance.post<ApiResponse<LoginResponse>>(this._url.LOGIN, {
      email,
      password,
    });
  }

  getProfile() {
    return axiosInstance.get<ApiResponse<{ user: LoginResponse['user'] }>>(this._url.ME);
  }

  sendForgotOtp(mobileNumber: string) {
    return axiosInstance.post<ApiResponse<OtpMeta>>(this._url.FORGOT_SEND_OTP, { mobileNumber });
  }

  resendForgotOtp(mobileNumber: string) {
    return axiosInstance.post<ApiResponse<OtpMeta>>(this._url.FORGOT_RESEND_OTP, { mobileNumber });
  }

  verifyForgotOtp(mobileNumber: string, otp: string) {
    return axiosInstance.post<ApiResponse<VerifyOtpResponse>>(this._url.FORGOT_VERIFY_OTP, {
      mobileNumber,
      otp,
    });
  }

  resetPassword(resetToken: string, newPassword: string, confirmPassword: string) {
    return axiosInstance.post<ApiResponse<null>>(this._url.FORGOT_RESET_PASSWORD, {
      resetToken,
      newPassword,
      confirmPassword,
    });
  }
}

export const authService = new AuthService();
