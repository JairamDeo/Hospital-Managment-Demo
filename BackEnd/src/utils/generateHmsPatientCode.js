import HmsPatient from '../models/hmsPatient.model.js';
import { buildPatientCode, getPatientCodePrefix } from './clinicSettings.util.js';

/**
 * Patient code format: {PREFIX}-0001/mm-yy (sequence resets each calendar month)
 */
export const generateHmsPatientCode = async (date = new Date()) => {
  const prefix = await getPatientCodePrefix();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  const period = `${mm}-${yy}`;
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedPeriod = period.replace('-', '\\-');

  // Match 3 or 4 digit sequences so old AH-001/... codes still increment correctly
  const last = await HmsPatient.findOne({
    patientCode: { $regex: new RegExp(`^${escapedPrefix}-\\d{3,4}/${escapedPeriod}$`) },
  })
    .sort({ patientCode: -1 })
    .select('patientCode')
    .lean();

  let seq = 1;
  if (last?.patientCode) {
    const match = last.patientCode.match(new RegExp(`^${escapedPrefix}-(\\d{3,4})/`));
    if (match) seq = parseInt(match[1], 10) + 1;
  }

  return buildPatientCode(prefix, seq, date);
};
