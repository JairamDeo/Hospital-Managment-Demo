import { logger } from '../utils/logger.js';
import { autoCancelUnacknowledgedPastAppointments } from '../admin/services/hmsAppointment.service.js';

let intervalHandle = null;

export const runAutoCancelPastAppointments = async () => {
  try {
    const cancelled = await autoCancelUnacknowledgedPastAppointments();
    if (cancelled > 0) {
      logger.info(`Auto-cancelled ${cancelled} past unacknowledged appointment(s)`);
    }
  } catch (error) {
    logger.error(`Auto-cancel appointments job failed: ${error.message}`);
  }
};

export const startAutoCancelAppointmentsJob = () => {
  if (process.env.AUTO_CANCEL_APPOINTMENTS_ENABLED === 'false') {
    logger.info('Auto-cancel appointments job disabled');
    return;
  }

  const pollMs = Number.parseInt(
    process.env.AUTO_CANCEL_APPOINTMENTS_POLL_MS || String(15 * 60 * 1000),
    10
  );

  logger.info(`Auto-cancel past appointments job started — poll every ${pollMs}ms`);
  void runAutoCancelPastAppointments();
  intervalHandle = setInterval(() => {
    void runAutoCancelPastAppointments();
  }, pollMs);
};

export const stopAutoCancelAppointmentsJob = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
};
