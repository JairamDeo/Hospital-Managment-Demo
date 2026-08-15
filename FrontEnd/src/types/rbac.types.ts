export type RbacModuleKey =
  | 'dashboard'
  | 'patients'
  | 'appointments'
  | 'prescriptions'
  | 'panchakarma'
  | 'ipd'
  | 'lab'
  | 'masterData'
  | 'pharmacy'
  | 'staff'
  | 'patientInsurance'
  | 'analytics'
  | 'billing'
  | 'settings';

export type StaffRole = 'Doctor' | 'Therapist' | 'Support' | 'Lab';

export interface ModulePermission {
  view: boolean;
  edit: boolean;
}

export type RbacPermissions = Record<RbacModuleKey, ModulePermission>;

export interface RbacRoleConfig {
  role: StaffRole;
  modules: RbacPermissions;
}

export const RBAC_MODULE_LABELS: Record<RbacModuleKey, string> = {
  dashboard: 'Dashboard',
  patients: 'Patients',
  appointments: 'Appointments',
  prescriptions: 'Prescriptions',
  panchakarma: 'Panchakarma',
  ipd: 'IPD',
  lab: 'Lab',
  masterData: 'Master Data',
  pharmacy: 'Pharmacy',
  staff: 'Staff',
  patientInsurance: 'Health Insurance',
  analytics: 'Analytics',
  billing: 'Billing',
  settings: 'Settings',
};

export const RBAC_MODULE_KEYS: RbacModuleKey[] = [
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
