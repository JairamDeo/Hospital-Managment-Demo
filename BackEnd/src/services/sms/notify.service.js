import { logger } from '../../utils/logger.js';
import {
  isMsg91Enabled,
  sendOtpSms,
  sendAppointmentReminderSms,
  sendFollowUpReminderSms,
  isAppointmentReminderSmsEnabled,
  isFollowUpReminderSmsEnabled,
} from './msg91.service.js';
import {
  isWhatsAppOtpEnabled,
  isAppointmentReminderWhatsAppEnabled,
  isFollowUpReminderWhatsAppEnabled,
  sendOtpWhatsApp,
  sendAppointmentReminderWhatsApp,
  sendFollowUpReminderWhatsApp,
} from './foxgloveWhatsApp.service.js';

const wasDelivered = (result) => result?.success === true;

/**
 * OTP — forgot password / login (SMS + WhatsApp when configured).
 */
export const sendOtpNotification = async (mobileNumber, otp) => {
  const smsOn = isMsg91Enabled();
  const waOn = isWhatsAppOtpEnabled();

  if (!smsOn && !waOn) {
    logger.info(`OTP (dev — no SMS/WA configured) for ${mobileNumber}: ${otp}`);
    return { skipped: true };
  }

  const [smsResult, waResult] = await Promise.allSettled([
    smsOn ? sendOtpSms(mobileNumber, otp) : Promise.resolve({ skipped: true }),
    waOn ? sendOtpWhatsApp(mobileNumber, otp) : Promise.resolve({ skipped: true }),
  ]);

  const smsOk = smsResult.status === 'fulfilled' && wasDelivered(smsResult.value);
  const waOk = waResult.status === 'fulfilled' && wasDelivered(waResult.value);

  if (smsOk || waOk) {
    return { success: true, sms: smsOk, whatsapp: waOk };
  }

  const parts = [];
  if (smsResult.status === 'rejected') parts.push(`SMS: ${smsResult.reason?.message}`);
  if (waResult.status === 'rejected') parts.push(`WhatsApp: ${waResult.reason?.message}`);
  throw new Error(parts.join(' | ') || 'OTP delivery failed');
};

export const isOtpNotificationEnabled = () => isMsg91Enabled() || isWhatsAppOtpEnabled();

export const isAppointmentReminderEnabled = () =>
  isAppointmentReminderSmsEnabled() || isAppointmentReminderWhatsAppEnabled();

export const isFollowUpReminderEnabled = () =>
  isFollowUpReminderSmsEnabled() || isFollowUpReminderWhatsAppEnabled();

/**
 * ~1 hr before appointment — SMS and/or WhatsApp.
 */
export const sendAppointmentReminder = async (mobileNumber, payload) => {
  const smsOn = isAppointmentReminderSmsEnabled();
  const waOn = isAppointmentReminderWhatsAppEnabled();

  if (!smsOn && !waOn) return { skipped: true };

  const [smsResult, waResult] = await Promise.allSettled([
    smsOn
      ? sendAppointmentReminderSms(mobileNumber, payload)
      : Promise.resolve({ skipped: true }),
    waOn
      ? sendAppointmentReminderWhatsApp(mobileNumber, payload)
      : Promise.resolve({ skipped: true }),
  ]);

  const smsOk = smsResult.status === 'fulfilled' && wasDelivered(smsResult.value);
  const waOk = waResult.status === 'fulfilled' && wasDelivered(waResult.value);

  if (smsOk || waOk) return { success: true, sms: smsOk, whatsapp: waOk };

  if (smsResult.status === 'rejected') throw smsResult.reason;
  if (waResult.status === 'rejected') throw waResult.reason;
  return { skipped: true };
};

/**
 * ~1 hr before follow-up — SMS and/or WhatsApp.
 */
export const sendFollowUpReminder = async (mobileNumber, payload) => {
  const smsOn = isFollowUpReminderSmsEnabled();
  const waOn = isFollowUpReminderWhatsAppEnabled();

  if (!smsOn && !waOn) return { skipped: true };

  const [smsResult, waResult] = await Promise.allSettled([
    smsOn ? sendFollowUpReminderSms(mobileNumber, payload) : Promise.resolve({ skipped: true }),
    waOn
      ? sendFollowUpReminderWhatsApp(mobileNumber, payload)
      : Promise.resolve({ skipped: true }),
  ]);

  const smsOk = smsResult.status === 'fulfilled' && wasDelivered(smsResult.value);
  const waOk = waResult.status === 'fulfilled' && wasDelivered(waResult.value);

  if (smsOk || waOk) return { success: true, sms: smsOk, whatsapp: waOk };

  if (smsResult.status === 'rejected') throw smsResult.reason;
  if (waResult.status === 'rejected') throw waResult.reason;
  return { skipped: true };
};
