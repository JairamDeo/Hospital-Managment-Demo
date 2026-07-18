export const RBAC_MODULE_KEYS = [
  'dashboard',
  'patients',
  'appointments',
  'prescriptions',
  'panchakarma',
  'ipd',
  'lab',
  'masterData',
  'pharmacy',
  'staff',
  'patientInsurance',
  'analytics',
  'billing',
  'settings',
];

const full = () => ({ view: true, edit: true });
const viewOnly = () => ({ view: true, edit: false });

const denied = () => ({ view: false, edit: false });

export const DEFAULT_RBAC_BY_ROLE = {
  Doctor: {
    dashboard: viewOnly(),
    patients: viewOnly(),
    appointments: { view: true, edit: true },
    prescriptions: { view: true, edit: true },
    panchakarma: denied(),
    ipd: { view: true, edit: true },
    lab: denied(),
    masterData: denied(),
    pharmacy: denied(),
    staff: denied(),
    patientInsurance: denied(),
    analytics: denied(),
    billing: denied(),
    settings: denied(),
  },
  Therapist: {
    dashboard: viewOnly(),
    patients: viewOnly(),
    appointments: denied(),
    prescriptions: denied(),
    panchakarma: { view: true, edit: true },
    ipd: denied(),
    lab: denied(),
    masterData: denied(),
    pharmacy: denied(),
    staff: denied(),
    patientInsurance: denied(),
    analytics: denied(),
    billing: denied(),
    settings: denied(),
  },
  Support: {
    dashboard: viewOnly(),
    patients: { view: true, edit: true },
    appointments: { view: true, edit: true },
    prescriptions: viewOnly(),
    panchakarma: viewOnly(),
    ipd: { view: true, edit: true },
    lab: denied(),
    masterData: { view: false, edit: false },
    pharmacy: viewOnly(),
    staff: viewOnly(),
    patientInsurance: { view: true, edit: true },
    analytics: { view: false, edit: false },
    billing: { view: true, edit: true },
    settings: viewOnly(),
  },
  Lab: {
    dashboard: viewOnly(),
    patients: denied(),
    appointments: denied(),
    prescriptions: denied(),
    panchakarma: denied(),
    ipd: denied(),
    lab: { view: true, edit: true },
    masterData: denied(),
    pharmacy: denied(),
    staff: denied(),
    patientInsurance: denied(),
    analytics: denied(),
    billing: denied(),
    settings: denied(),
  },
};

export const adminPermissions = () => {
  const perms = Object.fromEntries(RBAC_MODULE_KEYS.map((key) => [key, full()]));
  perms.prescriptions = viewOnly();
  return perms;
};
