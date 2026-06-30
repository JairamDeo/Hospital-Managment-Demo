import axios from 'axios';
import { logger } from '../../utils/logger.js';
import { formatIndianMobile } from './msg91.service.js';

const DEFAULT_BASE = 'https://partnersv1.pinbot.ai/v3';

const isWaGloballyEnabled = () => process.env.FOXGLOVE_WA_ENABLED !== 'false';

const waBaseConfigured = () =>
  Boolean(process.env.FOXGLOVE_WA_API_KEY && process.env.FOXGLOVE_WA_PHONE_NUMBER_ID);

/** Read Foxglove env with fallback to legacy MSG91 WhatsApp template names during migration. */
const waEnv = (foxKey, legacyKey) => process.env[foxKey] || process.env[legacyKey];

const languageCode = () =>
  waEnv('FOXGLOVE_WA_LANGUAGE_CODE', 'MSG91_WA_LANGUAGE_CODE') || 'en';

const messagesUrl = () => {
  const base = (process.env.FOXGLOVE_WA_BASE_URL || DEFAULT_BASE).replace(/\/$/, '');
  const phoneId = String(process.env.FOXGLOVE_WA_PHONE_NUMBER_ID).trim();
  return `${base}/${phoneId}/messages`;
};

/**
 * Foxglove / Pinbot expects local 10-digit Indian numbers in examples;
 * use FOXGLOVE_WA_TO_FORMAT=intl for 91XXXXXXXXXX.
 */
export const formatWaRecipient = (mobileNumber) => {
  const digits = String(mobileNumber).replace(/\D/g, '');
  if (process.env.FOXGLOVE_WA_TO_FORMAT === 'intl') {
    return formatIndianMobile(mobileNumber);
  }
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 10) return digits;
  if (digits.length > 10) return digits.slice(-10);
  return digits;
};

const buildBodyComponent = (texts) => {
  const parameters = texts
    .filter((t) => t != null && String(t).trim() !== '')
    .map((t) => ({ type: 'text', text: String(t) }));

  if (!parameters.length) return null;
  return { type: 'body', parameters };
};

const buildOtpButtonComponent = (otp) => {
  const mode = process.env.FOXGLOVE_WA_OTP_BUTTON_TYPE || 'copy_code';
  if (mode === 'url') {
    return {
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: String(otp) }],
    };
  }
  return {
    type: 'button',
    sub_type: 'copy_code',
    index: '0',
    parameters: [{ type: 'coupon_code', coupon_code: String(otp) }],
  };
};

/**
 * Send approved WhatsApp template via Foxglove (Pinbot Meta Cloud API).
 * @see BackEnd/docs/FOXGLOVE_WHATSAPP_INTEGRATION.md
 */
export const sendWhatsAppTemplate = async ({
  templateName,
  mobileNumber,
  bodyTexts = [],
  buttonComponents = [],
  logLabel = 'WhatsApp',
}) => {
  if (!isWaGloballyEnabled() || !waBaseConfigured() || !templateName) {
    logger.warn(`Foxglove WhatsApp not configured for ${logLabel} — mobile ${mobileNumber}`);
    return { skipped: true };
  }

  const to = formatWaRecipient(mobileNumber);
  const components = [];
  const body = buildBodyComponent(bodyTexts);
  if (body) components.push(body);
  components.push(...buttonComponents.filter(Boolean));

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode() },
      ...(components.length ? { components } : {}),
    },
  };

  try {
    const { data, status } = await axios.post(messagesUrl(), payload, {
      headers: {
        apikey: process.env.FOXGLOVE_WA_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 25000,
    });

    if (status >= 400 || data?.error) {
      const errMsg =
        data?.error?.message || data?.message || data?.msg || 'Foxglove WhatsApp send failed';
      logger.error(`Foxglove WhatsApp error (${logLabel}):`, data);
      throw new Error(errMsg);
    }

    logger.info(`Foxglove WhatsApp ${logLabel} sent to ${to}`);
    return {
      success: true,
      messageId: data?.messages?.[0]?.id || data?.message_id || data?.id,
    };
  } catch (error) {
    const detail = error.response?.data || error.message;
    logger.error(`Foxglove WhatsApp ${logLabel} failed:`, detail);
    throw error;
  }
};

export const isWhatsAppOtpEnabled = () => {
  if (!isWaGloballyEnabled() || !waBaseConfigured()) return false;
  return Boolean(waEnv('FOXGLOVE_WA_OTP_TEMPLATE_NAME', 'MSG91_WA_OTP_TEMPLATE_NAME'));
};

export const isAppointmentReminderWhatsAppEnabled = () => {
  if (!isWaGloballyEnabled() || !waBaseConfigured()) return false;
  return Boolean(
    waEnv('FOXGLOVE_WA_APPOINTMENT_TEMPLATE_NAME', 'MSG91_WA_APPOINTMENT_TEMPLATE_NAME')
  );
};

export const isFollowUpReminderWhatsAppEnabled = () => {
  if (!isWaGloballyEnabled() || !waBaseConfigured()) return false;
  return Boolean(
    waEnv('FOXGLOVE_WA_FOLLOWUP_TEMPLATE_NAME', 'MSG91_WA_FOLLOWUP_TEMPLATE_NAME')
  );
};

/** OTP on WhatsApp (authentication / utility template). */
export const sendOtpWhatsApp = async (mobileNumber, otp) => {
  const templateName = waEnv('FOXGLOVE_WA_OTP_TEMPLATE_NAME', 'MSG91_WA_OTP_TEMPLATE_NAME');
  const buttonComponents = [];

  if (process.env.FOXGLOVE_WA_OTP_BUTTON_ENABLED === 'true') {
    buttonComponents.push(buildOtpButtonComponent(otp));
  }

  return sendWhatsAppTemplate({
    templateName,
    mobileNumber,
    bodyTexts: [String(otp)],
    buttonComponents,
    logLabel: 'OTP',
  });
};

export const sendAppointmentReminderWhatsApp = async (mobileNumber, payload) => {
  const { patientName, doctorName, date, time } = payload;
  return sendWhatsAppTemplate({
    templateName: waEnv(
      'FOXGLOVE_WA_APPOINTMENT_TEMPLATE_NAME',
      'MSG91_WA_APPOINTMENT_TEMPLATE_NAME'
    ),
    mobileNumber,
    bodyTexts: [patientName, doctorName, date, time],
    logLabel: 'appointment reminder',
  });
};

export const sendFollowUpReminderWhatsApp = async (mobileNumber, payload) => {
  const { patientName, doctorName, date, time } = payload;
  return sendWhatsAppTemplate({
    templateName: waEnv(
      'FOXGLOVE_WA_FOLLOWUP_TEMPLATE_NAME',
      'MSG91_WA_FOLLOWUP_TEMPLATE_NAME'
    ),
    mobileNumber,
    bodyTexts: [patientName, doctorName, date, time],
    logLabel: 'follow-up reminder',
  });
};
