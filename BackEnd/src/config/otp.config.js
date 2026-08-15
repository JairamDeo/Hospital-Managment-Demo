/**
 * OTP settings from environment variables.
 */
export const getOtpConfig = () => {
  const expirySeconds = parseInt(process.env.OTP_EXPIRY_SECONDS || '120', 10);
  const resendCooldownSeconds = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '30', 10);
  const staticOtp = (process.env.STATIC_OTP || '').trim();

  return {
    expirySeconds: Number.isFinite(expirySeconds) && expirySeconds > 0 ? expirySeconds : 120,
    resendCooldownSeconds:
      Number.isFinite(resendCooldownSeconds) && resendCooldownSeconds > 0
        ? resendCooldownSeconds
        : 30,
    staticOtp,
    expiryMs: (Number.isFinite(expirySeconds) && expirySeconds > 0 ? expirySeconds : 120) * 1000,
    resendCooldownMs:
      (Number.isFinite(resendCooldownSeconds) && resendCooldownSeconds > 0
        ? resendCooldownSeconds
        : 30) * 1000,
  };
};

export const isStaticOtpMatch = (otp) => {
  const { staticOtp } = getOtpConfig();
  if (!staticOtp) return false;
  return String(otp).trim() === staticOtp;
};
