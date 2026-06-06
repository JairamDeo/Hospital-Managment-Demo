export type RbacModuleKey =
  | 'dashboard'
  | 'patients'
  | 'appointments'
  | 'prescriptions'
  | 'panchakarma'
  | 'masterData'
  | 'pharmacy'
  | 'staff'
  | 'analytics'
  | 'billing'
  | 'settings';

export type StaffRole = 'Doctor' | 'Therapist' | 'Support';

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
  masterData: 'Master Data',
  pharmacy: 'Pharmacy',
  staff: 'Staff',
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
  'masterData',
  'pharmacy',
  'staff',
  'analytics',
  'billing',
  'settings',
];
