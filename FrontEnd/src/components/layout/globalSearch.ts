import {
  CalendarDays,
  LayoutDashboard,
  Leaf,
  Pill,
  Receipt,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { MOCK_INVOICES } from '@/pages/billing/data/mockBilling';
import { MOCK_APPOINTMENTS } from '@/pages/appointments/data/mockAppointments';
import { MOCK_PATIENTS } from '@/pages/patients/data/mockPatients';
import { MOCK_STAFF } from '@/pages/staff/data/mockStaff';
import {
  ROUTES,
  invoiceDetailPath,
  patientDetailPath,
  staffDetailPath,
  appointmentDetailPath,
} from '@/constants/routes';

export type SearchResultType =
  | 'patient'
  | 'staff'
  | 'invoice'
  | 'appointment'
  | 'page';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  href: string;
}

const PAGE_RESULTS: SearchResult[] = [
  { id: 'page-dashboard', type: 'page', title: 'Dashboard', subtitle: 'Clinic overview', href: ROUTES.DASHBOARD },
  { id: 'page-patients', type: 'page', title: 'Patients', subtitle: 'Patient registry', href: ROUTES.PATIENTS },
  { id: 'page-appointments', type: 'page', title: 'Appointments', subtitle: 'Schedule & calendar', href: ROUTES.APPOINTMENTS },
  { id: 'page-panchakarma', type: 'page', title: 'Panchakarma', subtitle: 'Therapy programs', href: ROUTES.PANCHAKARMA },
  { id: 'page-pharmacy', type: 'page', title: 'Pharmacy', subtitle: 'Inventory & stock', href: ROUTES.PHARMACY },
  { id: 'page-staff', type: 'page', title: 'Staff', subtitle: 'Team directory', href: ROUTES.STAFF },
  { id: 'page-analytics', type: 'page', title: 'Analytics', subtitle: 'Reports & KPIs', href: ROUTES.ANALYTICS },
  { id: 'page-billing', type: 'page', title: 'Billing', subtitle: 'Invoices & payments', href: ROUTES.BILLING },
  { id: 'page-settings', type: 'page', title: 'Settings', subtitle: 'Clinic preferences', href: ROUTES.SETTINGS },
];

export const TYPE_CONFIG: Record<SearchResultType, { label: string; icon: LucideIcon; tone: string }> = {
  patient: { label: 'Patients', icon: Users, tone: 'bg-pink-50 text-pink-600' },
  staff: { label: 'Staff', icon: UserCog, tone: 'bg-violet-50 text-violet-600' },
  invoice: { label: 'Invoices', icon: Receipt, tone: 'bg-amber-50 text-amber-600' },
  appointment: { label: 'Appointments', icon: CalendarDays, tone: 'bg-blue-50 text-blue-600' },
  page: { label: 'Pages', icon: LayoutDashboard, tone: 'bg-sage-mist text-sage-deep' },
};

const buildIndex = (): SearchResult[] => [
  ...PAGE_RESULTS,
  ...MOCK_PATIENTS.map((p) => ({
    id: `patient-${p.id}`,
    type: 'patient' as const,
    title: p.name,
    subtitle: `#${p.id} · ${p.treatment}`,
    href: patientDetailPath(p.id),
  })),
  ...MOCK_STAFF.map((s) => ({
    id: `staff-${s.id}`,
    type: 'staff' as const,
    title: s.name,
    subtitle: `${s.role} · ${s.title}`,
    href: staffDetailPath(s.id),
  })),
  ...MOCK_INVOICES.map((inv) => ({
    id: `invoice-${inv.id}`,
    type: 'invoice' as const,
    title: `#${inv.id}`,
    subtitle: `${inv.patientName} · ${inv.treatment}`,
    href: invoiceDetailPath(inv.id),
  })),
  ...MOCK_APPOINTMENTS.map((a) => ({
    id: `appointment-${a.id}`,
    type: 'appointment' as const,
    title: a.id,
    subtitle: `${a.patientName} · ${a.type}`,
    href: appointmentDetailPath(a.id),
  })),
];

const SEARCH_INDEX = buildIndex();

export const searchGlobal = (query: string, limit = 12): SearchResult[] => {
  const q = query.trim().toLowerCase();
  if (!q) return PAGE_RESULTS.slice(0, 6);

  return SEARCH_INDEX.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.href.toLowerCase().includes(q)
  ).slice(0, limit);
};

export const QUICK_LINKS = [
  { label: 'Patients', href: ROUTES.PATIENTS, icon: Users },
  { label: 'Appointments', href: ROUTES.APPOINTMENTS, icon: CalendarDays },
  { label: 'Pharmacy', href: ROUTES.PHARMACY, icon: Pill },
  { label: 'Panchakarma', href: ROUTES.PANCHAKARMA, icon: Leaf },
];
