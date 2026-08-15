import {
  isAppointmentReminderEmailEnabled,
  isFollowUpReminderEmailEnabled,
} from './mail.config.js';
import { sendMail } from './mail.service.js';
import { mailSubject, renderMailTemplate } from './mailTemplate.service.js';

export const sendAppointmentReminderEmail = async (email, payload) => {
  if (!isAppointmentReminderEmailEnabled() || !email?.trim()) {
    return { skipped: true, reason: email ? 'appointment_email_disabled' : 'no_email' };
  }

  const { patientName, doctorName, date, time } = payload;
  const html = renderMailTemplate('appointment-reminder.html', {
    patientName,
    doctorName,
    date,
    time,
  });

  return sendMail({
    to: email.trim(),
    subject: mailSubject(
      'MAIL_APPOINTMENT_SUBJECT',
      `Appointment reminder — ${process.env.HOSPITAL_NAME || 'Ayurveda Hospital'}`
    ),
    html,
    logLabel: 'appointment reminder email',
  });
};

export const sendFollowUpReminderEmail = async (email, payload) => {
  if (!isFollowUpReminderEmailEnabled() || !email?.trim()) {
    return { skipped: true, reason: email ? 'followup_email_disabled' : 'no_email' };
  }

  const { patientName, doctorName, date, time } = payload;
  const html = renderMailTemplate('followup-reminder.html', {
    patientName,
    doctorName,
    date,
    time,
  });

  return sendMail({
    to: email.trim(),
    subject: mailSubject(
      'MAIL_FOLLOWUP_SUBJECT',
      `Follow-up reminder — ${process.env.HOSPITAL_NAME || 'Ayurveda Hospital'}`
    ),
    html,
    logLabel: 'follow-up reminder email',
  });
};
