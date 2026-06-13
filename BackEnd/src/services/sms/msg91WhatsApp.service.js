import axios from 'axios';
import { logger } from '../../utils/logger.js';
import { formatIndianMobile } from './msg91.service.js';

const WA_BULK_URL = 'https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/';

const isWaGloballyEnabled = () => process.env.MSG91_WA_ENABLED !== 'false';

const waBaseConfigured = () =>
  Boolean(
    process.env.MSG91_AUTH_KEY &&
      process.env.MSG91_WA_INTEGRATED_NUMBER &&
      process.env.MSG91_WA_NAMESPACE
  );

export const isWhatsAppOtpEnabled = () => {
  if (!isWaGloballyEnabled() || !waBaseConfigured()) return false;
  return Boolean(process.env.MSG91_WA_OTP_TEMPLATE_NAME);
};

export const isAppointmentReminderWhatsAppEnabled = () => {
  if (!isWaGloballyEnabled() || !waBaseConfigured()) return false;
  return Boolean(process.env.MSG91_WA_APPOINTMENT_TEMPLATE_NAME);
};

export const isFollowUpReminderWhatsAppEnabled = () => {
  if (!isWaGloballyEnabled() || !waBaseConfigured()) return false;
  return Boolean(process.env.MSG91_WA_FOLLOWUP_TEMPLATE_NAME);
};

const languageCode = () => process.env.MSG91_WA_LANGUAGE_CODE || 'en';

/**
 * Build MSG91 WhatsApp template components map.
 * Each env key (e.g. body_1) maps to { type: 'text', value }.
 */
const buildComponents = (slotValues) => {
  const components = {};
  for (const [slot, value] of Object.entries(slotValues)) {
    if (!slot || value == null || value === '') continue;
    if (typeof value === 'object' && value.type) {
      components[slot] = value;
    } else {
      components[slot] = { type: 'text', value: String(value) };
    }
  }
  return components;
};

/**
 * Send approved WhatsApp template via MSG91 bulk API.
 * @see https://docs.msg91.com/whatsapp
 */
export const sendWhatsAppTemplate = async ({
  templateName,
  mobileNumber,
  componentsBySlot,
  logLabel = 'WhatsApp',
}) => {
  if (!isWaGloballyEnabled() || !waBaseConfigured() || !templateName) {
    logger.warn(
      `MSG91 WhatsApp not configured for ${logLabel} — mobile ${mobileNumber}`
    );
    return { skipped: true };
  }

  const to = formatIndianMobile(mobileNumber);
  const components = buildComponents(componentsBySlot);

  const body = {
    integrated_number: String(process.env.MSG91_WA_INTEGRATED_NUMBER).replace(/\D/g, ''),
    content_type: 'template',
    payload: {
      messaging_product: 'whatsapp',
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode(),
          policy: 'deterministic',
        },
        namespace: process.env.MSG91_WA_NAMESPACE,
        to_and_components: [
          {
            to: [to],
            components,
          },
        ],
      },
    },
  };

  try {
    const { data, status } = await axios.post(WA_BULK_URL, body, {
      headers: {
        authkey: process.env.MSG91_AUTH_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 25000,
    });

    const responseType = data?.type?.toLowerCase?.();
    if (status >= 400 || responseType === 'error') {
      const errMsg = data?.message || data?.msg || 'MSG91 WhatsApp send failed';
      logger.error(`MSG91 WhatsApp error (${logLabel}):`, data);
      throw new Error(errMsg);
    }

    logger.info(`MSG91 WhatsApp ${logLabel} queued for ${to}`);
    return { success: true, requestId: data?.request_id || data?.message };
  } catch (error) {
    const detail = error.response?.data || error.message;
    logger.error(`MSG91 WhatsApp ${logLabel} failed:`, detail);
    throw error;
  }
};

const appointmentReminderWaSlots = ({ patientName, doctorName, date, time }) => ({
  [process.env.MSG91_WA_APPT_VAR_PATIENT || 'body_1']: patientName,
  [process.env.MSG91_WA_APPT_VAR_DOCTOR || 'body_2']: doctorName,
  [process.env.MSG91_WA_APPT_VAR_DATE || 'body_3']: date,
  [process.env.MSG91_WA_APPT_VAR_TIME || 'body_4']: time,
});

const followUpReminderWaSlots = ({ patientName, doctorName, date, time }) => ({
  [process.env.MSG91_WA_FOLLOWUP_VAR_PATIENT || 'body_1']: patientName,
  [process.env.MSG91_WA_FOLLOWUP_VAR_DOCTOR || 'body_2']: doctorName,
  [process.env.MSG91_WA_FOLLOWUP_VAR_DATE || 'body_3']: date,
  [process.env.MSG91_WA_FOLLOWUP_VAR_TIME || 'body_4']: time,
});

/** OTP on WhatsApp (authentication / utility template). */
export const sendOtpWhatsApp = async (mobileNumber, otp) => {
  const slot = process.env.MSG91_WA_OTP_VARIABLE || 'body_1';
  const componentsBySlot = { [slot]: String(otp) };

  const buttonSlot = process.env.MSG91_WA_OTP_BUTTON_VARIABLE;
  if (buttonSlot) {
    componentsBySlot[buttonSlot] = {
      subtype: 'url',
      type: 'text',
      value: String(otp),
    };
  }

  return sendWhatsAppTemplate({
    templateName: process.env.MSG91_WA_OTP_TEMPLATE_NAME,
    mobileNumber,
    componentsBySlot,
    logLabel: 'OTP',
  });
};

export const sendAppointmentReminderWhatsApp = async (mobileNumber, payload) => {
  return sendWhatsAppTemplate({
    templateName: process.env.MSG91_WA_APPOINTMENT_TEMPLATE_NAME,
    mobileNumber,
    componentsBySlot: appointmentReminderWaSlots(payload),
    logLabel: 'appointment reminder',
  });
};

export const sendFollowUpReminderWhatsApp = async (mobileNumber, payload) => {
  return sendWhatsAppTemplate({
    templateName: process.env.MSG91_WA_FOLLOWUP_TEMPLATE_NAME,
    mobileNumber,
    componentsBySlot: followUpReminderWaSlots(payload),
    logLabel: 'follow-up reminder',
  });
};
