import { createTransport } from 'nodemailer';
import { logger } from '../../utils/logger.js';
import { isMailConfigured, mailBcc, mailFrom, smtpOptions } from './mail.config.js';

let transporter = null;

const getTransporter = () => {
  if (!isMailConfigured()) return null;
  if (!transporter) {
    transporter = createTransport(smtpOptions());
  }
  return transporter;
};

/**
 * Send HTML email via Nodemailer.
 * @returns {{ success: true, messageId?: string }} | {{ skipped: true }}
 */
export const sendMail = async ({ to, subject, html, attachments = [], logLabel = 'Email' }) => {
  if (!isMailConfigured()) {
    logger.warn(`Mail not configured — skipped ${logLabel} to ${to}`);
    return { skipped: true };
  }

  const transport = getTransporter();
  const mailOptions = {
    from: mailFrom(),
    to,
    subject,
    html,
    attachments,
  };

  const bcc = mailBcc();
  if (bcc) mailOptions.bcc = bcc;

  try {
    const info = await transport.sendMail(mailOptions);
    logger.info(`${logLabel} sent to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`${logLabel} failed for ${to}:`, error.message);
    throw error;
  }
};
