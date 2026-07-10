import moment from 'moment';
import HmsAppointment from '../models/hmsAppointment.model.js';
import HmsPatient from '../models/hmsPatient.model.js';
import { logger } from '../utils/logger.js';
import { resolvePatientEmail } from '../utils/patientEmail.util.js';
import {
  formatAppointmentDateDisplay,
  minutesUntilAppointment,
} from '../utils/appointment.util.js';
import {
  isAppointmentReminderEnabled,
  isFollowUpReminderEnabled,
  sendAppointmentReminder,
  sendFollowUpReminder,
} from '../services/sms/notify.service.js';

const reminderMinutesBefore = () =>
  Number.parseInt(process.env.SMS_REMINDER_MINUTES_BEFORE || '60', 10);

const reminderWindowMinutes = () =>
  Number.parseInt(process.env.SMS_REMINDER_WINDOW_MINUTES || '2', 10);

const isReminderEnabled = () => process.env.SMS_REMINDER_ENABLED !== 'false';

const isInReminderWindow = (date, timeSlot) => {
  const minutesUntil = minutesUntilAppointment(date, timeSlot);
  const target = reminderMinutesBefore();
  const halfWindow = reminderWindowMinutes() / 2;
  return minutesUntil >= target - halfWindow && minutesUntil <= target + halfWindow;
};

const loadPatientContacts = async (patientCodes) => {
  if (!patientCodes.length) return new Map();
  const rows = await HmsPatient.find({ patientCode: { $in: patientCodes } }).select(
    'patientCode mobileNumber email name'
  );
  return new Map(
    rows.map((p) => [
      p.patientCode,
      { mobile: p.mobileNumber, email: resolvePatientEmail(p), name: p.name },
    ])
  );
};

const reminderPayload = (appointment, date, timeDisplay) => ({
  patientName: appointment.patientName,
  doctorName: appointment.doctorName,
  date: formatAppointmentDateDisplay(date),
  time: timeDisplay,
});

export const runSmsReminders = async () => {
  if (!isReminderEnabled()) return;

  const now = moment();
  const rangeStart = now.clone().startOf('day').toDate();
  const rangeEnd = now.clone().add(2, 'days').endOf('day').toDate();

  const [upcomingRows, followUpRows] = await Promise.all([
    isAppointmentReminderEnabled()
      ? HmsAppointment.find({
          status: 'Upcoming',
          appointmentReminderSentAt: null,
          appointmentDate: { $gte: rangeStart, $lte: rangeEnd },
        }).lean()
      : [],
    isFollowUpReminderEnabled()
      ? HmsAppointment.find({
          status: 'Completed',
          followUpDate: { $ne: null, $gte: rangeStart, $lte: rangeEnd },
          followUpTimeSlot: { $nin: [null, ''] },
          followUpReminderSentAt: null,
        }).lean()
      : [],
  ]);

  const patientCodes = [
    ...new Set([
      ...upcomingRows.map((a) => a.patientCode),
      ...followUpRows.map((a) => a.patientCode),
    ]),
  ];
  const contactsByPatient = await loadPatientContacts(patientCodes);

  for (const row of upcomingRows) {
    if (!isInReminderWindow(row.appointmentDate, row.timeSlot)) continue;

    const contact = contactsByPatient.get(row.patientCode);
    if (!contact?.mobile && !contact?.email) {
      logger.warn(`Reminder skipped — no contact for patient ${row.patientCode}`);
      continue;
    }

    try {
      const result = await sendAppointmentReminder(
        contact?.mobile,
        reminderPayload(row, row.appointmentDate, row.timeDisplay),
        contact?.email
      );
      if (result?.success) {
        await HmsAppointment.updateOne(
          { _id: row._id },
          { $set: { appointmentReminderSentAt: new Date() } }
        );
        logger.info(
          `Appointment reminder sent for ${row.appointmentCode} (SMS: ${Boolean(result.sms)}, WA: ${Boolean(result.whatsapp)}, Email: ${Boolean(result.email)})`
        );
      }
    } catch (err) {
      logger.error(`Appointment reminder failed for ${row.appointmentCode}:`, err.message);
    }
  }

  for (const row of followUpRows) {
    if (!isInReminderWindow(row.followUpDate, row.followUpTimeSlot)) continue;

    const contact = contactsByPatient.get(row.patientCode);
    if (!contact?.mobile && !contact?.email) {
      logger.warn(`Follow-up reminder skipped — no contact for patient ${row.patientCode}`);
      continue;
    }

    try {
      const result = await sendFollowUpReminder(
        contact?.mobile,
        reminderPayload(row, row.followUpDate, row.followUpTimeDisplay),
        contact?.email
      );
      if (result?.success) {
        await HmsAppointment.updateOne(
          { _id: row._id },
          { $set: { followUpReminderSentAt: new Date() } }
        );
        logger.info(
          `Follow-up reminder sent for ${row.appointmentCode} (SMS: ${Boolean(result.sms)}, WA: ${Boolean(result.whatsapp)}, Email: ${Boolean(result.email)})`
        );
      }
    } catch (err) {
      logger.error(`Follow-up reminder failed for ${row.appointmentCode}:`, err.message);
    }
  }
};

let intervalHandle = null;

export const startSmsReminderJob = () => {
  if (!isReminderEnabled()) {
    logger.info('Reminder job disabled (SMS_REMINDER_ENABLED=false)');
    return;
  }

  const pollMs = Number.parseInt(process.env.SMS_REMINDER_POLL_INTERVAL_MS || '60000', 10);
  logger.info(
    `Reminder job started (SMS + WhatsApp + Email) — ${reminderMinutesBefore()} min before visit, poll every ${pollMs}ms`
  );

  void runSmsReminders();
  intervalHandle = setInterval(() => {
    void runSmsReminders();
  }, pollMs);
};

export const stopSmsReminderJob = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
};
