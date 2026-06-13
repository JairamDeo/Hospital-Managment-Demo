import { ROUTES, staffDetailPath } from '@/constants/routes';
import type { ModulePermission } from '@/types/api.types';
import type { RbacModuleKey } from '@/types/rbac.types';

export const ROUTE_MODULE_MAP: Record<string, RbacModuleKey> = {
  [ROUTES.ADMIN_DASHBOARD]: 'dashboard',
  [ROUTES.ADMIN_PATIENTS]: 'patients',
  [ROUTES.ADMIN_APPOINTMENTS]: 'appointments',
  [ROUTES.ADMIN_PANCHAKARMA]: 'panchakarma',
  [ROUTES.ADMIN_IPD]: 'ipd',
  [ROUTES.ADMIN_MASTER_DATA]: 'masterData',
  [ROUTES.ADMIN_PHARMACY]: 'pharmacy',
  [ROUTES.ADMIN_STAFF]: 'staff',
  [ROUTES.ADMIN_PATIENT_INSURANCE]: 'patientInsurance',
  [ROUTES.ADMIN_ANALYTICS]: 'analytics',
  [ROUTES.ADMIN_BILLING]: 'billing',
  [ROUTES.ADMIN_SETTINGS]: 'settings',
};

export const moduleForPath = (pathname: string): RbacModuleKey | null => {
  if (pathname.startsWith(ROUTES.ADMIN_PATIENTS)) return 'patients';
  if (pathname.startsWith(ROUTES.ADMIN_APPOINTMENTS)) return 'appointments';
  if (pathname === ROUTES.ADMIN_PATIENT_INSURANCE) return 'patientInsurance';
  if (pathname.startsWith(ROUTES.ADMIN_STAFF)) return 'staff';
  if (pathname.startsWith(ROUTES.ADMIN_BILLING)) return 'billing';
  if (pathname.startsWith(`${ROUTES.ADMIN_PANCHAKARMA}/programs/`)) return 'panchakarma';
  if (pathname.startsWith(ROUTES.ADMIN_PANCHAKARMA)) return 'panchakarma';
  if (pathname.startsWith(`${ROUTES.ADMIN_IPD}/admissions/`)) return 'ipd';
  if (pathname.startsWith(ROUTES.ADMIN_IPD)) return 'ipd';
  return ROUTE_MODULE_MAP[pathname] ?? null;
};

const LANDING_ORDER: { route: string; module: RbacModuleKey }[] = [
  { route: ROUTES.ADMIN_DASHBOARD, module: 'dashboard' },
  { route: ROUTES.ADMIN_APPOINTMENTS, module: 'appointments' },
  { route: ROUTES.ADMIN_PANCHAKARMA, module: 'panchakarma' },
  { route: ROUTES.ADMIN_IPD, module: 'ipd' },
  { route: ROUTES.ADMIN_PATIENTS, module: 'patients' },
  { route: ROUTES.ADMIN_PHARMACY, module: 'pharmacy' },
  { route: ROUTES.ADMIN_STAFF, module: 'staff' },
  { route: ROUTES.ADMIN_BILLING, module: 'billing' },
  { route: ROUTES.ADMIN_ANALYTICS, module: 'analytics' },
  { route: ROUTES.ADMIN_MASTER_DATA, module: 'masterData' },
  { route: ROUTES.ADMIN_SETTINGS, module: 'settings' },
];

export const defaultLandingRoute = (
  permissions: Record<string, ModulePermission> | undefined,
  isAdmin: boolean,
  staffCode?: string
): string => {
  if (isAdmin) return ROUTES.ADMIN_DASHBOARD;
  for (const { route, module } of LANDING_ORDER) {
    if (permissions?.[module]?.view) return route;
  }
  if (staffCode) return staffDetailPath(staffCode);
  return ROUTES.ADMIN_ACCESS_DENIED;
};
