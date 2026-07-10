/** Resolve 10-digit Indian WhatsApp recipient from patient record. */
export const resolvePatientWhatsAppNumber = (patient) => {
  const normalize = (value) => {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (digits.length < 10) return null;
    return digits.length === 10 ? digits : digits.slice(-10);
  };

  const dedicated = normalize(patient?.whatsappNumber);
  if (dedicated) return dedicated;

  if (process.env.FOXGLOVE_WA_USE_MOBILE_FALLBACK === 'false') return null;
  return normalize(patient?.mobileNumber);
};

export const maskWhatsAppNumber = (mobile) => {
  const digits = String(mobile ?? '').replace(/\D/g, '');
  const local = digits.length >= 10 ? digits.slice(-10) : digits;
  if (local.length < 4) return '—';
  return `${local.slice(0, 2)}****${local.slice(-4)}`;
};
