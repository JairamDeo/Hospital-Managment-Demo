export const STAFF_DEFAULT_PASSWORD = 'Admin@1234';

/** Login email from display name, e.g. "Dr. Ananya Sharma" → ananya.sharma@ayurveda.health */
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

  return `${local}@ayurveda.health`;
};
