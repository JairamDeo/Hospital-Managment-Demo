import moment from 'moment';

export const formatDisplayDate = (date) => {
  if (!date) return '';
  const m = moment(date);
  return m.isValid() ? m.format('DD-MMM-YYYY') : '';
};

export const formatApiDate = (date) => {
  if (!date) return null;
  const m = moment(date);
  return m.isValid() ? m.startOf('day').toDate() : null;
};

export const parseFlexibleDate = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const formats = ['YYYY-MM-DD', 'DD-MMM-YYYY', 'DD/MM/YYYY', 'DD-MM-YYYY', 'MMM D, YYYY'];
  const m = moment(raw, formats, true);
  if (m.isValid()) return m.startOf('day').toDate();
  const loose = moment(new Date(raw));
  return loose.isValid() ? loose.startOf('day').toDate() : null;
};

const diffMonths = (from, to) => {
  const start = moment(from);
  const end = moment(to);
  return Math.max(0, Math.round(end.diff(start, 'months', true)));
};

/**
 * Manufacturing date required.
 * Provide expiryDate OR bestBeforeMonths (shelf life from manufacturing).
 */
export const resolvePharmacyDates = ({ manufacturingDate, expiryDate, bestBeforeMonths }) => {
  const mfg = parseFlexibleDate(manufacturingDate);
  if (!mfg) {
    throw new Error('Manufacturing date is required (use YYYY-MM-DD or DD-MMM-YYYY)');
  }

  const expiryParsed = parseFlexibleDate(expiryDate);
  const monthsRaw = bestBeforeMonths?.toString().trim();
  const months =
    monthsRaw !== undefined && monthsRaw !== '' ? Number(monthsRaw) : null;

  if (expiryParsed) {
    if (expiryParsed < mfg) {
      throw new Error('Expiry date must be on or after manufacturing date');
    }
    return {
      manufacturingDate: mfg,
      expiryDate: expiryParsed,
      bestBeforeMonths:
        months && !Number.isNaN(months) && months > 0 ? months : diffMonths(mfg, expiryParsed),
    };
  }

  if (months !== null && !Number.isNaN(months) && months > 0) {
    const expiry = moment(mfg).add(months, 'months').startOf('day').toDate();
    return {
      manufacturingDate: mfg,
      expiryDate: expiry,
      bestBeforeMonths: months,
    };
  }

  throw new Error('Provide either Expiry Date or Best Before (months from manufacturing)');
};
