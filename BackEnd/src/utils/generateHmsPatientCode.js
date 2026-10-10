import HmsPatient from '../models/hmsPatient.model.js';
import { buildPatientCode, getPatientCodePrefix } from './clinicSettings.util.js';

/**
 * Patient code format: {PREFIX}-mm-yy/0001 (sequence resets each calendar month)
 */
export const generateHmsPatientCode = async (date = new Date()) => {
  const prefix = await getPatientCodePrefix();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  const period = `${mm}-${yy}`;
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedPeriod = period.replace(/-/g, '\\-');

  const newRe = new RegExp(`^${escapedPrefix}-${escapedPeriod}/(\\d{3,4})$`);
  const legacyRe = new RegExp(`^${escapedPrefix}-(\\d{3,4})/${escapedPeriod}$`);

  const rows = await HmsPatient.find({
    patientCode: {
      $regex: new RegExp(
        `^(?:${escapedPrefix}-${escapedPeriod}/\\d{3,4}|${escapedPrefix}-\\d{3,4}/${escapedPeriod})$`
      ),
    },
  })
    .select('patientCode')
    .lean();

  let maxSeq = 0;
  for (const row of rows) {
    const m = row.patientCode.match(newRe) || row.patientCode.match(legacyRe);
    if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
  }

  return buildPatientCode(prefix, maxSeq + 1, date);
};
