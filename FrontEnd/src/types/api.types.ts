export interface ApiResponse<T = unknown> {
  message: string;
  status_code: number;
  res: T | null;
}

export interface AdminUser {
  _id: string;
  userCode: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  mobileNumber: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: AdminUser;
}

export interface OtpMeta {
  expiresInSeconds: number;
  resendAfterSeconds: number;
}

export interface VerifyOtpResponse {
  resetToken: string;
}
