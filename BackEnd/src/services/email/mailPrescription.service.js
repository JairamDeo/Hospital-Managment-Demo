import { isPrescriptionEmailEnabled } from './mail.config.js';
import { sendMail } from './mail.service.js';
import { mailSubject, renderMailTemplate } from './mailTemplate.service.js';

export const sendPrescriptionEmail = async (
  email,
  { patientName, prescriptionLabel, attachmentBuffer, filename, mimeType = 'application/pdf' }
) => {
  if (!isPrescriptionEmailEnabled() || !email?.trim()) {
    return { skipped: true, reason: email ? 'prescription_email_disabled' : 'no_email' };
  }

  if (!attachmentBuffer) {
    throw new Error('Prescription PDF is required for email attachment');
  }

  const html = renderMailTemplate('prescription.html', {
    patientName,
    prescriptionLabel,
  });

  return sendMail({
    to: email.trim(),
    subject: mailSubject(
      'MAIL_PRESCRIPTION_SUBJECT',
      `Your prescription — ${prescriptionLabel}`
    ),
    html,
    attachments: [
      {
        filename: filename || 'prescription.pdf',
        content: attachmentBuffer,
        contentType: mimeType,
      },
    ],
    logLabel: 'prescription email',
  });
};
