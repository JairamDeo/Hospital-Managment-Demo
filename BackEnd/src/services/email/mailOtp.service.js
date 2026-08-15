import { isOtpEmailEnabled } from './mail.config.js';
import { sendMail } from './mail.service.js';
import { mailSubject, renderMailTemplate } from './mailTemplate.service.js';

export const sendOtpEmail = async (email, { name, otp, purpose = 'verify your account' }) => {
  if (!isOtpEmailEnabled() || !email?.trim()) {
    return { skipped: true, reason: email ? 'otp_email_disabled' : 'no_email' };
  }

  const html = renderMailTemplate('otp.html', {
    name: name || 'Patient',
    otp,
    purpose,
    expiryMinutes: Math.ceil(
      Number.parseInt(process.env.OTP_EXPIRY_SECONDS || '120', 10) / 60
    ),
  });

  return sendMail({
    to: email.trim(),
    subject: mailSubject('MAIL_OTP_SUBJECT', `Your OTP — ${process.env.HOSPITAL_NAME || 'Ayurveda HMS'}`),
    html,
    logLabel: 'OTP email',
  });
};
