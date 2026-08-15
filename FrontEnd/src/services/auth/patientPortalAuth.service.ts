import axiosInstance from '../http/axiosInstance';
import type {
  ApiResponse,
  MasterItem,
  PatientLoginResponse,
  PatientRegisterPayload,
  PatientUpdateProfilePayload,
  PatientUser,
  OtpMeta,
} from '@/types/api.types';

class PatientPortalAuthService {
  private readonly _url = {
    REGISTER: '/patient-portal/register',
    SEND_OTP: '/patient-portal/auth/send-otp',
    RESEND_OTP: '/patient-portal/auth/resend-otp',
    VERIFY_OTP: '/patient-portal/auth/verify-otp',
    ME: '/patient-portal/me',
    MASTERS: '/patient-portal/masters',
  } as const;

  getMasters() {
    return axiosInstance.get<
      ApiResponse<{ prakriti: MasterItem[]; treatments: MasterItem[] }>
    >(this._url.MASTERS);
  }

  register(payload: PatientRegisterPayload) {
    return axiosInstance.post<ApiResponse<OtpMeta & { mobileNumber: string }>>(
      this._url.REGISTER,
      payload
    );
  }

  sendOtp(mobileNumber: string) {
    return axiosInstance.post<ApiResponse<OtpMeta>>(this._url.SEND_OTP, { mobileNumber });
  }

  resendOtp(mobileNumber: string) {
    return axiosInstance.post<ApiResponse<OtpMeta>>(this._url.RESEND_OTP, { mobileNumber });
  }

  verifyOtp(mobileNumber: string, otp: string) {
    return axiosInstance.post<ApiResponse<PatientLoginResponse>>(this._url.VERIFY_OTP, {
      mobileNumber,
      otp,
    });
  }

  getProfile() {
    return axiosInstance.get<ApiResponse<{ patient: PatientUser }>>(this._url.ME);
  }

  updateProfile(payload: PatientUpdateProfilePayload) {
    return axiosInstance.patch<ApiResponse<{ patient: PatientUser }>>(this._url.ME, payload);
  }
}

export const patientPortalAuthService = new PatientPortalAuthService();
