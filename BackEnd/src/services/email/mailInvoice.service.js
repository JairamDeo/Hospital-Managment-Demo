import { isInvoiceEmailEnabled } from './mail.config.js';
import { sendMail } from './mail.service.js';
import { mailSubject, renderMailTemplate } from './mailTemplate.service.js';

export const sendInvoiceEmail = async (
  email,
  { patientName, invoiceCode, amount, attachmentBuffer, filename, mimeType = 'application/pdf' }
) => {
  if (!isInvoiceEmailEnabled() || !email?.trim()) {
    return { skipped: true, reason: email ? 'invoice_email_disabled' : 'no_email' };
  }

  if (!attachmentBuffer) {
    throw new Error('Invoice document is required for email attachment');
  }

  const html = renderMailTemplate('invoice.html', {
    patientName,
    invoiceCode,
    amount,
  });

  return sendMail({
    to: email.trim(),
    subject: mailSubject('MAIL_INVOICE_SUBJECT', `Invoice ${invoiceCode}`),
    html,
    attachments: [
      {
        filename: filename || `${invoiceCode}.pdf`,
        content: attachmentBuffer,
        contentType: mimeType,
      },
    ],
    logLabel: 'invoice email',
  });
};
