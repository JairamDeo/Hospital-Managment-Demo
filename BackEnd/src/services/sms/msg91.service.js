import axios from 'axios';
import { logger } from '../../utils/logger.js';

export const formatIndianMobile = (mobileNumber) => {
  const digits = String(mobileNumber).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return digits;
  return digits;
};

const isMsg91GloballyEnabled = () => process.env.MSG91_ENABLED !== 'false';

export const isMsg91Enabled = () => {
  if (!isMsg91GloballyEnabled()) return false;
  return Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID);
};

export const isAppointmentReminderSmsEnabled = () => {
  if (!isMsg91GloballyEnabled()) return false;
  return Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_APPOINTMENT_TEMPLATE_ID);
};

export const isFollowUpReminderSmsEnabled = () => {
  if (!isMsg91GloballyEnabled()) return false;
  return Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_FOLLOWUP_TEMPLATE_ID);
};

export const isPaymentLinkSmsEnabled = () => {
  if (!isMsg91GloballyEnabled()) return false;
  return Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_PAYMENT_LINK_TEMPLATE_ID);
};

/**
 * Generic MSG91 Flow API sender — plug in template id + variable map from env.
 * @see https://docs.msg91.com/
 */
export const sendFlowSms = async ({ templateId, mobileNumber, variables, logLabel = 'SMS' }) => {
  if (!isMsg91GloballyEnabled() || !process.env.MSG91_AUTH_KEY || !templateId) {
    logger.warn(
      `MSG91 not configured for ${logLabel} — mobile ${mobileNumber}: ${JSON.stringify(variables)}`
    );
    return { skipped: true };
  }

  const authKey = process.env.MSG91_AUTH_KEY;
  const mobiles = formatIndianMobile(mobileNumber);
  const recipient = { mobiles, ...variables };

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
      logger.error(`MSG91 API error (${logLabel}):`, data);
      throw new Error(errMsg);
    }

    logger.info(`MSG91 ${logLabel} queued for ${mobiles}`);
    return { success: true, requestId: data?.request_id || data?.message };
  } catch (error) {
    const detail = error.response?.data || error.message;
    logger.error(`MSG91 ${logLabel} failed:`, detail);
    throw error;
  }
};

/**
 * Send OTP SMS via MSG91 Flow API (template must include OTP variable).
 */
export const sendOtpSms = async (mobileNumber, otp) => {
  const otpVariable = process.env.MSG91_OTP_VARIABLE || 'OTP';
  return sendFlowSms({
    templateId: process.env.MSG91_TEMPLATE_ID,
    mobileNumber,
    variables: { [otpVariable]: String(otp) },
    logLabel: 'OTP',
  });
};

const appointmentReminderVars = ({ patientName, doctorName, date, time }) => ({
  [process.env.MSG91_APPT_VAR_PATIENT || 'PATIENT']: patientName,
  [process.env.MSG91_APPT_VAR_DOCTOR || 'DOCTOR']: doctorName,
  [process.env.MSG91_APPT_VAR_DATE || 'DATE']: date,
  [process.env.MSG91_APPT_VAR_TIME || 'TIME']: time,
});

const followUpReminderVars = ({ patientName, doctorName, date, time }) => ({
  [process.env.MSG91_FOLLOWUP_VAR_PATIENT || 'PATIENT']: patientName,
  [process.env.MSG91_FOLLOWUP_VAR_DOCTOR || 'DOCTOR']: doctorName,
  [process.env.MSG91_FOLLOWUP_VAR_DATE || 'DATE']: date,
  [process.env.MSG91_FOLLOWUP_VAR_TIME || 'TIME']: time,
});

/** Reminder SMS sent ~1 hr before scheduled appointment. */
export const sendAppointmentReminderSms = async (mobileNumber, payload) => {
  return sendFlowSms({
    templateId: process.env.MSG91_APPOINTMENT_TEMPLATE_ID,
    mobileNumber,
    variables: appointmentReminderVars(payload),
    logLabel: 'appointment reminder',
  });
};

/** Reminder SMS sent ~1 hr before scheduled follow-up visit. */
export const sendFollowUpReminderSms = async (mobileNumber, payload) => {
  return sendFlowSms({
    templateId: process.env.MSG91_FOLLOWUP_TEMPLATE_ID,
    mobileNumber,
    variables: followUpReminderVars(payload),
    logLabel: 'follow-up reminder',
  });
};

const paymentLinkSmsVars = ({ patientName, amount, invoiceCode, paymentLink }) => ({
  [process.env.MSG91_PAYLINK_VAR_PATIENT || 'PATIENT']: patientName,
  [process.env.MSG91_PAYLINK_VAR_AMOUNT || 'AMOUNT']: amount,
  [process.env.MSG91_PAYLINK_VAR_INVOICE || 'INVOICE']: invoiceCode,
  [process.env.MSG91_PAYLINK_VAR_LINK || 'LINK']: paymentLink,
});

/** SMS with Razorpay payment link for billing collect-payment flow. */
export const sendPaymentLinkSms = async (mobileNumber, payload) => {
  return sendFlowSms({
    templateId: process.env.MSG91_PAYMENT_LINK_TEMPLATE_ID,
    mobileNumber,
    variables: paymentLinkSmsVars(payload),
    logLabel: 'payment link',
  });
};
