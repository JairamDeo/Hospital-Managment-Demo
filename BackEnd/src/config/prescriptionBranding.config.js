/** Clinic branding for prescription PDF — replace via env or edit here. */
export const PRESCRIPTION_BRANDING = {
  clinicName: process.env.CLINIC_NAME || 'Ayurveda Panchakarma Center',
  clinicTagline: process.env.CLINIC_TAGLINE || 'Ayurveda · Yoga & Naturopathy',
  address:
    process.env.CLINIC_ADDRESS ||
    'Chandramati Naka Road, Near Balaji Medical, Tiroda',
  phones: (process.env.CLINIC_PHONES || '+91 7020698542, +91 7020698542')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean),
  timings:
    process.env.CLINIC_TIMINGS ||
    'Mon–Wed 10 AM–8 PM, Thu 10 AM–2 PM, Sun Closed',
};

export const QUALIFICATION_LEVELS = ['UG', 'PG', 'Doctorate', 'Diploma', 'Certificate', 'Other'];
