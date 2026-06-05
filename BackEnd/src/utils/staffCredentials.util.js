export const STAFF_DEFAULT_PASSWORD = 'Admin@1234';

export const STAFF_EMAIL_DOMAIN = 'ayurvedahealth.com';

/** Login email from display name, e.g. "Dr. Ananya Sharma" → ananya.sharma@ayurvedahealth.com */
export const staffEmailFromName = (name, staffCode = '') => {
  const parts = name
    .replace(/^Dr\.\s*/i, '')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  let local =
    parts.length >= 2 ? `${parts[0]}.${parts[parts.length - 1]}` : parts[0] || 'staff';

  if (staffCode) {
    local = `${local}.${staffCode.toLowerCase().replace(/-/g, '')}`;
  }

  return `${local}@${STAFF_EMAIL_DOMAIN}`;
};

/** Accept both legacy @ayurveda.health and current @ayurvedahealth.com staff emails */
export const staffLoginEmailAliases = (email) => {
  const normalized = email.toLowerCase().trim();
  const aliases = new Set([normalized]);

  if (normalized.endsWith('@ayurveda.health')) {
    aliases.add(normalized.replace('@ayurveda.health', `@${STAFF_EMAIL_DOMAIN}`));
  } else if (normalized.endsWith(`@${STAFF_EMAIL_DOMAIN}`)) {
    aliases.add(normalized.replace(`@${STAFF_EMAIL_DOMAIN}`, '@ayurveda.health'));
  }

  return [...aliases];
};
