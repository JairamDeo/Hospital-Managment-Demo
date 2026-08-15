import { isPaymentLinkEmailEnabled } from './mail.config.js';
import { sendMail } from './mail.service.js';
import { mailSubject, renderMailTemplate } from './mailTemplate.service.js';

export const sendPaymentLinkEmail = async (email, payload) => {
  if (!isPaymentLinkEmailEnabled() || !email?.trim()) {
    return { skipped: true, reason: email ? 'payment_link_email_disabled' : 'no_email' };
  }

  const { patientName, amount, invoiceCode, paymentLink } = payload;
  const html = renderMailTemplate('payment-link.html', {
    patientName,
    amount,
    invoiceCode,
    paymentLink,
  });

  return sendMail({
    to: email.trim(),
    subject: mailSubject(
      'MAIL_PAYMENT_LINK_SUBJECT',
      `Payment link for invoice ${invoiceCode}`
    ),
    html,
    logLabel: 'payment link email',
  });
};
