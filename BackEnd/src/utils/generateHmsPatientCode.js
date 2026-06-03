import HmsPatient from '../models/hmsPatient.model.js';

/**
 * Patient code format: AH-001/mm-yy (sequence resets each calendar month)
 */
export const generateHmsPatientCode = async (date = new Date()) => {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  const period = `${mm}-${yy}`;
  const suffix = `/${period}`;
  const escapedPeriod = period.replace('-', '\\-');

  const last = await HmsPatient.findOne({
    patientCode: { $regex: new RegExp(`^AH-\\d{3}/${escapedPeriod}$`) },
  })
    .sort({ patientCode: -1 })
    .select('patientCode')
    .lean();

  let seq = 1;
  if (last?.patientCode) {
    const match = last.patientCode.match(/^AH-(\d{3})\//);
    if (match) seq = parseInt(match[1], 10) + 1;
  }

  return `AH-${String(seq).padStart(3, '0')}${suffix}`;
};
