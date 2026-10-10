import ClinicSettings from '../models/clinicSettings.model.js';

const DEFAULT_PREFIX = 'AH';

export const normalizePatientCodePrefix = (value) => {
  const cleaned = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
  return cleaned || DEFAULT_PREFIX;
};

export const getClinicSettings = async () => {
  let row = await ClinicSettings.findOne({ key: 'default' });
  if (!row) {
    row = await ClinicSettings.create({
      key: 'default',
      name: 'Ayurveda Health',
      patientCodePrefix: DEFAULT_PREFIX,
    });
  }
  return row;
};

export const getPatientCodePrefix = async () => {
  const settings = await getClinicSettings();
  return normalizePatientCodePrefix(settings.patientCodePrefix);
};

/**
 * Format: PREFIX-MM-YY/0001 (sequence resets each calendar month)
 * Example: AH-10-26/0001
 */
export const buildPatientCode = (prefix, seq, date = new Date()) => {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${normalizePatientCodePrefix(prefix)}-${mm}-${yy}/${String(seq).padStart(4, '0')}`;
};

export const previewPatientCodeFormat = (prefix, date = new Date()) =>
  buildPatientCode(prefix, 1, date);
