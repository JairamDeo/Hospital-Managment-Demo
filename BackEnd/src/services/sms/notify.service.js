import { logger } from '../../utils/logger.js';
import { getOtpConfig } from '../../config/otp.config.js';
import {
  isMsg91Enabled,
  sendOtpSms,
  sendAppointmentReminderSms,
  sendFollowUpReminderSms,
  isAppointmentReminderSmsEnabled,
  isFollowUpReminderSmsEnabled,
  isPaymentLinkSmsEnabled,
  sendPaymentLinkSms,
} from '../sms/msg91.service.js';
import {
  isWhatsAppOtpEnabled,
  isAppointmentReminderWhatsAppEnabled,
  isFollowUpReminderWhatsAppEnabled,
  isPaymentLinkWhatsAppEnabled,
  sendOtpWhatsApp,
  sendAppointmentReminderWhatsApp,
  sendFollowUpReminderWhatsApp,
  sendPaymentLinkWhatsApp,
} from '../sms/foxgloveWhatsApp.service.js';
import { isOtpEmailEnabled, isAppointmentReminderEmailEnabled, isFollowUpReminderEmailEnabled, isPaymentLinkEmailEnabled } from '../email/mail.config.js';
import { sendOtpEmail } from '../email/mailOtp.service.js';
import {
  sendAppointmentReminderEmail,
  sendFollowUpReminderEmail,
} from '../email/mailReminders.service.js';
import { sendPaymentLinkEmail } from '../email/mailPaymentLink.service.js';

const wasDelivered = (result) => result?.success === true;

/**
 * OTP — SMS + WhatsApp + Email when configured.
 */
export const sendOtpNotification = async (mobileNumber, otp, { email, name, purpose } = {}) => {
  const smsOn = isMsg91Enabled();
  const waOn = isWhatsAppOtpEnabled();
  const emailOn = isOtpEmailEnabled() && Boolean(email);

  if (!smsOn && !waOn && !emailOn) {
    logger.info(`OTP (dev — no SMS/WA/Email configured) for ${mobileNumber}: ${otp}`);
    return { skipped: true };
  }

  const [smsResult, waResult, emailResult] = await Promise.allSettled([
    smsOn ? sendOtpSms(mobileNumber, otp) : Promise.resolve({ skipped: true }),
    waOn ? sendOtpWhatsApp(mobileNumber, otp) : Promise.resolve({ skipped: true }),
    emailOn
      ? sendOtpEmail(email, { name, otp, purpose })
      : Promise.resolve({ skipped: true, reason: 'no_email' }),
  ]);

  const smsOk = smsResult.status === 'fulfilled' && wasDelivered(smsResult.value);
  const waOk = waResult.status === 'fulfilled' && wasDelivered(waResult.value);
  const emailOk = emailResult.status === 'fulfilled' && wasDelivered(emailResult.value);

  if (smsOk || waOk || emailOk) {
    return {
      success: true,
      sms: smsOk,
      whatsapp: waOk,
      email: emailOk,
      emailSkipped: !email,
    };
  }

  const parts = [];
  if (smsResult.status === 'rejected') parts.push(`SMS: ${smsResult.reason?.message}`);
  if (waResult.status === 'rejected') parts.push(`WhatsApp: ${waResult.reason?.message}`);
  if (emailResult.status === 'rejected') parts.push(`Email: ${emailResult.reason?.message}`);

  const { staticOtp } = getOtpConfig();
  if (staticOtp) {
    logger.warn(
      `OTP delivery failed for ${mobileNumber} (${parts.join(' | ') || 'no channel'}); STATIC_OTP is set — use ${staticOtp} to verify`
    );
    return { success: true, bypass: true, staticOtpMode: true };
  }

  throw new Error(parts.join(' | ') || 'OTP delivery failed');
};

export const isOtpNotificationEnabled = () =>
  isMsg91Enabled() || isWhatsAppOtpEnabled() || isOtpEmailEnabled();

export const isAppointmentReminderEnabled = () =>
  isAppointmentReminderSmsEnabled() ||
  isAppointmentReminderWhatsAppEnabled() ||
  isAppointmentReminderEmailEnabled();

export const isFollowUpReminderEnabled = () =>
  isFollowUpReminderSmsEnabled() ||
  isFollowUpReminderWhatsAppEnabled() ||
  isFollowUpReminderEmailEnabled();

export const isPaymentLinkNotificationEnabled = () =>
  isPaymentLinkSmsEnabled() || isPaymentLinkWhatsAppEnabled() || isPaymentLinkEmailEnabled();

/**
 * ~1 hr before appointment — SMS, WhatsApp, and/or Email.
 */
export const sendAppointmentReminder = async (mobileNumber, payload, email = null) => {
  const smsOn = isAppointmentReminderSmsEnabled();
  const waOn = isAppointmentReminderWhatsAppEnabled();
  const emailOn = isAppointmentReminderEmailEnabled() && Boolean(email);

  if (!smsOn && !waOn && !emailOn) return { skipped: true };

  const [smsResult, waResult, emailResult] = await Promise.allSettled([
    smsOn
      ? sendAppointmentReminderSms(mobileNumber, payload)
      : Promise.resolve({ skipped: true }),
    waOn
      ? sendAppointmentReminderWhatsApp(mobileNumber, payload)
      : Promise.resolve({ skipped: true }),
    emailOn
      ? sendAppointmentReminderEmail(email, payload)
      : Promise.resolve({ skipped: true, reason: 'no_email' }),
  ]);

  const smsOk = smsResult.status === 'fulfilled' && wasDelivered(smsResult.value);
  const waOk = waResult.status === 'fulfilled' && wasDelivered(waResult.value);
  const emailOk = emailResult.status === 'fulfilled' && wasDelivered(emailResult.value);

  if (smsOk || waOk || emailOk) {
    return { success: true, sms: smsOk, whatsapp: waOk, email: emailOk, emailSkipped: !email };
  }

  if (smsResult.status === 'rejected') throw smsResult.reason;
  if (waResult.status === 'rejected') throw waResult.reason;
  if (emailResult.status === 'rejected') throw emailResult.reason;
  return { skipped: true };
};

/**
 * ~1 hr before follow-up — SMS, WhatsApp, and/or Email.
 */
export const sendFollowUpReminder = async (mobileNumber, payload, email = null) => {
  const smsOn = isFollowUpReminderSmsEnabled();
  const waOn = isFollowUpReminderWhatsAppEnabled();
  const emailOn = isFollowUpReminderEmailEnabled() && Boolean(email);

  if (!smsOn && !waOn && !emailOn) return { skipped: true };

  const [smsResult, waResult, emailResult] = await Promise.allSettled([
    smsOn ? sendFollowUpReminderSms(mobileNumber, payload) : Promise.resolve({ skipped: true }),
    waOn
      ? sendFollowUpReminderWhatsApp(mobileNumber, payload)
      : Promise.resolve({ skipped: true }),
    emailOn
      ? sendFollowUpReminderEmail(email, payload)
      : Promise.resolve({ skipped: true, reason: 'no_email' }),
  ]);

  const smsOk = smsResult.status === 'fulfilled' && wasDelivered(smsResult.value);
  const waOk = waResult.status === 'fulfilled' && wasDelivered(waResult.value);
  const emailOk = emailResult.status === 'fulfilled' && wasDelivered(emailResult.value);

  if (smsOk || waOk || emailOk) {
    return { success: true, sms: smsOk, whatsapp: waOk, email: emailOk, emailSkipped: !email };
  }

  if (smsResult.status === 'rejected') throw smsResult.reason;
  if (waResult.status === 'rejected') throw waResult.reason;
  if (emailResult.status === 'rejected') throw emailResult.reason;
  return { skipped: true };
};

/**
 * Razorpay payment link — SMS + WhatsApp + Email (skipped gracefully when contact missing).
 */
export const sendPaymentLinkNotification = async (
  mobileNumber,
  whatsappNumber,
  patientEmail,
  payload
) => {
  const smsOn = isPaymentLinkSmsEnabled();
  const waOn = isPaymentLinkWhatsAppEnabled() && Boolean(whatsappNumber);
  const emailOn = isPaymentLinkEmailEnabled() && Boolean(patientEmail);

  if (!smsOn && !waOn && !emailOn) {
    throw new Error('Payment link SMS/WhatsApp/Email is not configured');
  }

  const [smsResult, waResult, emailResult] = await Promise.allSettled([
    smsOn ? sendPaymentLinkSms(mobileNumber, payload) : Promise.resolve({ skipped: true }),
    waOn
      ? sendPaymentLinkWhatsApp(whatsappNumber, payload)
      : Promise.resolve({ skipped: true, reason: 'no_whatsapp' }),
    emailOn
      ? sendPaymentLinkEmail(patientEmail, payload)
      : Promise.resolve({ skipped: true, reason: 'no_email' }),
  ]);

  const smsOk = smsResult.status === 'fulfilled' && wasDelivered(smsResult.value);
  const waOk = waResult.status === 'fulfilled' && wasDelivered(waResult.value);
  const emailOk = emailResult.status === 'fulfilled' && wasDelivered(emailResult.value);

  if (smsOk || waOk || emailOk) {
    return {
      success: true,
      sms: smsOk,
      whatsapp: waOk,
      email: emailOk,
      whatsappSkipped: !whatsappNumber,
      emailSkipped: !patientEmail,
    };
  }

  if (smsResult.status === 'rejected') throw smsResult.reason;
  if (waResult.status === 'rejected') throw waResult.reason;
  if (emailResult.status === 'rejected') throw emailResult.reason;
  throw new Error('Payment link notification failed');
};
