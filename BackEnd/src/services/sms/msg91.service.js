import axios from 'axios';
import { logger } from '../../utils/logger.js';

export const formatIndianMobile = (mobileNumber) => {
  const digits = String(mobileNumber).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return digits;
  return digits;
};

export const isMsg91Enabled = () => {
  if (process.env.MSG91_ENABLED === 'false') return false;
  return Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID);
};

/**
 * Send OTP SMS via MSG91 Flow API (template must include OTP variable).
 * @see https://docs.msg91.com/
 */
export const sendOtpSms = async (mobileNumber, otp) => {
  if (!isMsg91Enabled()) {
    logger.warn(
      `MSG91 not configured — OTP for ${mobileNumber}: ${otp} (set MSG91_AUTH_KEY & MSG91_TEMPLATE_ID)`
    );
    return { skipped: true };
  }

  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  const otpVariable = process.env.MSG91_OTP_VARIABLE || 'OTP';
  const mobiles = formatIndianMobile(mobileNumber);

  const recipient = { mobiles };
  recipient[otpVariable] = String(otp);

  try {
    const { data, status } = await axios.post(
      'https://control.msg91.com/api/v5/flow/',
      {
        template_id: templateId,
        short_url: '0',
        recipients: [recipient],
      },
      {
        headers: {
          authkey: authKey,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    const responseType = data?.type?.toLowerCase?.();
    if (status >= 400 || responseType === 'error') {
      const errMsg = data?.message || data?.msg || 'MSG91 failed to send SMS';
      logger.error('MSG91 API error:', data);
      throw new Error(errMsg);
    }

    logger.info(`MSG91 OTP SMS queued for ${mobiles}`);
    return { success: true, requestId: data?.request_id || data?.message };
  } catch (error) {
    const detail = error.response?.data || error.message;
    logger.error('MSG91 sendOtpSms failed:', detail);
    throw error;
  }
};
