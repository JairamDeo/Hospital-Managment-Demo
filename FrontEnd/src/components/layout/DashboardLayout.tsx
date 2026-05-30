import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { ROUTES } from '@/constants/routes';
import { getPatientById } from '@/pages/patients/data/mockPatientDetails';
import { getStaffById } from '@/pages/staff/data/mockStaffDetails';
import { getInvoiceById } from '@/pages/billing/data/mockInvoiceDetails';

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/patients': 'Patients',
  '/appointments': 'Appointments',
  '/panchakarma': 'Panchakarma',
  '/pharmacy': 'Pharmacy',
  '/staff': 'Staff',
  '/analytics': 'Analytics',
  '/billing': 'Billing',
  '/settings': 'Settings',
};

const LayoutContent = () => {
  const { pathname } = useLocation();
  const { isMobileOpen, closeMobile } = useSidebar();

  const patientMatch = pathname.match(/^\/patients\/([^/]+)$/);
  const patientId = patientMatch?.[1];
  const patient = patientId ? getPatientById(patientId) : null;

  const staffMatch = pathname.match(/^\/staff\/([^/]+)$/);
  const staffId = staffMatch?.[1];
  const staffMember = staffId ? getStaffById(staffId) : null;

  const invoiceMatch = pathname.match(/^\/billing\/([^/]+)$/);
  const invoiceId = invoiceMatch?.[1];
  const invoice = invoiceId ? getInvoiceById(invoiceId) : null;

  const headerProps = patient
    ? {
        breadcrumbs: [
          { label: 'Patients', href: ROUTES.PATIENTS },
          { label: patient.name },
        ],
      }
    : staffMember
      ? {
          breadcrumbs: [
            { label: 'Staff', href: ROUTES.STAFF },
            { label: staffMember.name },
          ],
        }
      : invoice
        ? {
            breadcrumbs: [
              { label: 'Billing', href: ROUTES.BILLING },
              { label: `#${invoice.id}` },
            ],
          }
        : { title: titles[pathname] || 'Dashboard' };

  const isDashboard = pathname === '/dashboard';
  const isFixedHeightPage =
    isDashboard ||
    pathname === '/appointments' ||
    pathname === '/panchakarma' ||
    pathname === '/pharmacy';

  return (
    <div className="flex h-screen overflow-hidden bg-cream">
      <Sidebar variant="desktop" />

      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40 backdrop-blur-[1px]"
            onClick={closeMobile}
            aria-label="Close menu overlay"
          />
          <div className="relative flex h-full w-64 max-w-[85vw] shadow-2xl">
            <Sidebar variant="mobile" />
          </div>
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Header {...headerProps} />
        <main
          className={`flex min-h-0 flex-1 flex-col ${
            isFixedHeightPage ? 'overflow-hidden px-4 pb-3 pt-5' : 'overflow-y-auto p-4 sm:p-6'
          }`}
        >
          <div className={isFixedHeightPage ? 'flex min-h-0 flex-1 flex-col' : 'w-full'}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export const DashboardLayout = () => (
  <SidebarProvider>
    <LayoutContent />
  </SidebarProvider>
);
