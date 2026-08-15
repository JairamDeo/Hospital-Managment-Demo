/** SMTP / Nodemailer configuration from environment. */
export const isMailConfigured = () => {
  if (process.env.MAIL_ENABLED === 'false') return false;
  return Boolean(
    process.env.MAIL_HOST && process.env.MAIL_USER && (process.env.MAIL_PASSWORD || process.env.EMAIL_PASSWORD)
  );
};

export const mailUser = () => process.env.MAIL_USER || process.env.EMAIL || '';

export const mailPassword = () => process.env.MAIL_PASSWORD || process.env.EMAIL_PASSWORD || '';

export const mailFrom = () => {
  const name = process.env.MAIL_FROM_NAME || process.env.HOSPITAL_NAME || 'Ayurveda HMS';
  const address = process.env.MAIL_FROM_EMAIL || mailUser();
  return `"${name}" <${address}>`;
};

export const hospitalName = () =>
  process.env.HOSPITAL_NAME || process.env.MAIL_FROM_NAME || 'Ayurveda Hospital';

export const mailBcc = () => process.env.MAIL_BCC || process.env.BCC_EMAIL || '';

export const smtpOptions = () => ({
  host: process.env.MAIL_HOST || 'smtp.zoho.in',
  port: Number.parseInt(process.env.MAIL_PORT || '587', 10),
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: mailUser(),
    pass: mailPassword(),
  },
  tls: {
    rejectUnauthorized: process.env.MAIL_TLS_REJECT_UNAUTHORIZED !== 'false',
  },
});

export const isOtpEmailEnabled = () =>
  isMailConfigured() && process.env.MAIL_OTP_ENABLED !== 'false';

export const isAppointmentReminderEmailEnabled = () =>
  isMailConfigured() && process.env.MAIL_APPOINTMENT_ENABLED !== 'false';

export const isFollowUpReminderEmailEnabled = () =>
  isMailConfigured() && process.env.MAIL_FOLLOWUP_ENABLED !== 'false';

export const isPaymentLinkEmailEnabled = () =>
  isMailConfigured() && process.env.MAIL_PAYMENT_LINK_ENABLED !== 'false';

export const isPrescriptionEmailEnabled = () =>
  isMailConfigured() && process.env.MAIL_PRESCRIPTION_ENABLED !== 'false';

export const isInvoiceEmailEnabled = () =>
  isMailConfigured() && process.env.MAIL_INVOICE_ENABLED !== 'false';
