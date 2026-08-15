import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { ROUTES } from '@/constants/routes';
import { getStaffById } from '@/pages/staff/data/mockStaffDetails';

const titles: Record<string, string> = {
  [ROUTES.ADMIN_DASHBOARD]: 'Dashboard',
  [ROUTES.ADMIN_PATIENTS]: 'Patients',
  [ROUTES.ADMIN_PATIENT_INSURANCE]: 'Health insurance',
  [ROUTES.ADMIN_APPOINTMENTS]: 'Appointments',
  [ROUTES.ADMIN_PANCHAKARMA]: 'Panchakarma',
  [ROUTES.ADMIN_LAB]: 'Lab',
  [ROUTES.ADMIN_PHARMACY]: 'Pharmacy',
  [ROUTES.ADMIN_STAFF]: 'Staff',
  [ROUTES.ADMIN_STAFF_COMPENSATION]: 'Staff compensation',
  [ROUTES.ADMIN_ANALYTICS]: 'Analytics',
  [ROUTES.ADMIN_BILLING]: 'Billing',
  [ROUTES.ADMIN_BILLING_MEDICINE]: 'Medicine Bill',
  [ROUTES.ADMIN_BILLING_CONSULTATION]: 'Consultation Bill',
  [ROUTES.ADMIN_BILLING_PANCHAKARMA]: 'Panchakarma Bill',
  [ROUTES.ADMIN_PRESCRIPTION]: 'Prescription',
  [ROUTES.ADMIN_SETTINGS]: 'Settings',
};

const LayoutContent = () => {
  const { pathname } = useLocation();
  const { isMobileOpen, closeMobile } = useSidebar();

  const patientMatch = pathname.match(/^\/admin\/patients\/([^/]+)$/);
  const patientId = patientMatch?.[1] ? decodeURIComponent(patientMatch[1]) : undefined;
  const patientBreadcrumbLabel = patientId ? decodeURIComponent(patientId) : null;

  const staffMatch = pathname.match(/^\/admin\/staff\/([^/]+)$/);
  const staffId =
    staffMatch?.[1] && staffMatch[1] !== 'compensation' ? staffMatch[1] : undefined;
  const staffMember = staffId ? getStaffById(staffId) : null;
  const isStaffCompensation = pathname === ROUTES.ADMIN_STAFF_COMPENSATION;

  const invoiceMatch = pathname.match(/^\/admin\/billing\/([^/]+)$/);
  const invoiceId = invoiceMatch?.[1] ? decodeURIComponent(invoiceMatch[1]) : null;

  const appointmentFollowUpMatch = pathname.match(/^\/admin\/appointments\/([^/]+)\/follow-up$/);
  const followUpAppointmentId = appointmentFollowUpMatch?.[1]
    ? decodeURIComponent(appointmentFollowUpMatch[1])
    : null;

  const panchakarmaTreatmentMatch = pathname.match(
    /^\/admin\/panchakarma\/appointments\/([^/]+)\/treatment$/
  );
  const panchakarmaTreatmentId = panchakarmaTreatmentMatch?.[1]
    ? decodeURIComponent(panchakarmaTreatmentMatch[1])
    : null;

  const prescriptionMatch = pathname === ROUTES.ADMIN_PRESCRIPTION;

  const billingSubMatch = pathname.match(/^\/admin\/billing\/(medicine|consultation|panchakarma)$/);
  const billingSubPage = billingSubMatch?.[1];

  const appointmentMatch = pathname.match(/^\/admin\/appointments\/([^/]+)$/);
  const appointmentId = appointmentMatch?.[1]
    ? decodeURIComponent(appointmentMatch[1])
    : null;

  const headerProps = patientBreadcrumbLabel
    ? {
        breadcrumbs: [
          { label: 'Patients', href: ROUTES.ADMIN_PATIENTS },
          { label: patientBreadcrumbLabel },
        ],
      }
    : panchakarmaTreatmentId
      ? {
          breadcrumbs: [
            { label: 'Appointments', href: ROUTES.ADMIN_APPOINTMENTS },
            { label: panchakarmaTreatmentId },
            { label: 'Treatment plan' },
          ],
        }
      : prescriptionMatch
        ? {
            breadcrumbs: [
              { label: 'Patients', href: ROUTES.ADMIN_PATIENTS },
              { label: 'New prescription' },
            ],
          }
        : billingSubPage
          ? {
              breadcrumbs: [
                { label: 'Billing', href: ROUTES.ADMIN_BILLING },
                {
                  label:
                    billingSubPage === 'medicine'
                      ? 'Medicine bill'
                      : billingSubPage === 'consultation'
                        ? 'Consultation bill'
                        : 'Panchakarma bill',
                },
              ],
            }
    : isStaffCompensation
      ? {
          breadcrumbs: [
            { label: 'Staff', href: ROUTES.ADMIN_STAFF },
            { label: 'Compensation' },
          ],
        }
      : staffMember
        ? {
            breadcrumbs: [
              { label: 'Staff', href: ROUTES.ADMIN_STAFF },
              { label: staffMember.name },
            ],
          }
        : invoiceId
        ? {
            breadcrumbs: [
              { label: 'Billing', href: ROUTES.ADMIN_BILLING },
              { label: `#${invoiceId}` },
            ],
          }
        : followUpAppointmentId
          ? {
              breadcrumbs: [
                { label: 'Appointments', href: ROUTES.ADMIN_APPOINTMENTS },
                { label: followUpAppointmentId, href: `/admin/appointments/${encodeURIComponent(followUpAppointmentId)}` },
                { label: 'Follow-up' },
              ],
            }
        : appointmentId
          ? {
              breadcrumbs: [
                { label: 'Appointments', href: ROUTES.ADMIN_APPOINTMENTS },
                { label: appointmentId },
              ],
            }
          : { title: titles[pathname] || 'Dashboard' };

  const isDashboard = pathname === ROUTES.ADMIN_DASHBOARD;
  const isFixedHeightPage =
    isDashboard ||
    pathname === ROUTES.ADMIN_APPOINTMENTS ||
    pathname === ROUTES.ADMIN_PANCHAKARMA ||
    pathname === ROUTES.ADMIN_PHARMACY;

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
            isFixedHeightPage
              ? 'overflow-hidden px-4 pb-4 pt-5 sm:px-5'
              : 'overflow-y-auto px-4 py-5 sm:px-6 sm:py-6'
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
