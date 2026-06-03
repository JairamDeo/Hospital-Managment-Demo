import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PageLoader } from '@/components/ui/Loader';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CustomerMobileLayout } from '@/components/customer/layout/CustomerMobileLayout';
import {
  AdminProtectedRoute,
  AdminPublicOnlyRoute,
  CustomerProtectedRoute,
  CustomerPublicOnlyRoute,
} from './ProtectedRoute';
import { ROUTES } from '@/constants/routes';

const WelcomePage = lazy(() => import('@/pages/customer/WelcomePage'));
const CustomerLoginPage = lazy(() => import('@/pages/customer/CustomerLoginPage'));
const CustomerRegisterPage = lazy(() => import('@/pages/customer/CustomerRegisterPage'));
const CustomerVerifyOtpPage = lazy(() => import('@/pages/customer/CustomerVerifyOtpPage'));
const CustomerHomePage = lazy(() => import('@/pages/customer/CustomerHomePage'));
const CustomerProfilePage = lazy(() => import('@/pages/customer/CustomerProfilePage'));

const LoginPage = lazy(() => import('@/pages/auth/Login/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPassword/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const AccessDeniedPage = lazy(() => import('@/pages/errors/AccessDeniedPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const PatientsPage = lazy(() => import('@/pages/patients/PatientsPage'));
const PatientDetailPage = lazy(() => import('@/pages/patients/PatientDetailPage'));
const AppointmentsPage = lazy(() => import('@/pages/appointments/AppointmentsPage'));
const AppointmentDetailPage = lazy(() => import('@/pages/appointments/AppointmentDetailPage'));
const PanchakarmaPage = lazy(() => import('@/pages/panchakarma/PanchakarmaPage'));
const PharmacyPage = lazy(() => import('@/pages/pharmacy/PharmacyPage'));
const StaffPage = lazy(() => import('@/pages/staff/StaffPage'));
const StaffDetailPage = lazy(() => import('@/pages/staff/StaffDetailPage'));
const AnalyticsPage = lazy(() => import('@/pages/analytics/AnalyticsPage'));
const BillingPage = lazy(() => import('@/pages/billing/BillingPage'));
const InvoiceDetailPage = lazy(() => import('@/pages/billing/InvoiceDetailPage'));
const MasterDataPage = lazy(() => import('@/pages/master-data/MasterDataPage'));

const withSuspense = (el: React.ReactNode) => (
  <Suspense fallback={<PageLoader />}>{el}</Suspense>
);

export const AppRoutes = () => (
  <Routes>
    {/* Customer portal */}
    <Route
      path={ROUTES.CUSTOMER_WELCOME}
      element={withSuspense(
        <CustomerPublicOnlyRoute>
          <WelcomePage />
        </CustomerPublicOnlyRoute>
      )}
    />
    <Route
      path={ROUTES.CUSTOMER_LOGIN}
      element={withSuspense(
        <CustomerPublicOnlyRoute>
          <CustomerLoginPage />
        </CustomerPublicOnlyRoute>
      )}
    />
    <Route
      path={ROUTES.CUSTOMER_REGISTER}
      element={withSuspense(
        <CustomerPublicOnlyRoute>
          <CustomerRegisterPage />
        </CustomerPublicOnlyRoute>
      )}
    />
    <Route
      path={ROUTES.CUSTOMER_VERIFY_OTP}
      element={withSuspense(
        <CustomerPublicOnlyRoute>
          <CustomerVerifyOtpPage />
        </CustomerPublicOnlyRoute>
      )}
    />

    <Route
      element={
        <CustomerProtectedRoute>
          <CustomerMobileLayout />
        </CustomerProtectedRoute>
      }
    >
      <Route path={ROUTES.CUSTOMER_HOME} element={withSuspense(<CustomerHomePage />)} />
      <Route path={ROUTES.CUSTOMER_PROFILE} element={withSuspense(<CustomerProfilePage />)} />
    </Route>

    {/* Admin auth */}
    <Route
      path={ROUTES.ADMIN_LOGIN}
      element={withSuspense(
        <AdminPublicOnlyRoute>
          <LoginPage />
        </AdminPublicOnlyRoute>
      )}
    />
    <Route
      path={ROUTES.ADMIN_FORGOT_PASSWORD}
      element={withSuspense(
        <AdminPublicOnlyRoute>
          <ForgotPasswordPage />
        </AdminPublicOnlyRoute>
      )}
    />
    <Route path={ROUTES.ADMIN_ACCESS_DENIED} element={withSuspense(<AccessDeniedPage />)} />

    {/* Admin app */}
    <Route
      element={
        <AdminProtectedRoute>
          <DashboardLayout />
        </AdminProtectedRoute>
      }
    >
      <Route path={ROUTES.ADMIN_DASHBOARD} element={withSuspense(<DashboardPage />)} />
      <Route path={ROUTES.ADMIN_PATIENTS} element={withSuspense(<PatientsPage />)} />
      <Route path={ROUTES.ADMIN_PATIENT_DETAIL} element={withSuspense(<PatientDetailPage />)} />
      <Route path={ROUTES.ADMIN_APPOINTMENTS} element={withSuspense(<AppointmentsPage />)} />
      <Route path={ROUTES.ADMIN_APPOINTMENT_DETAIL} element={withSuspense(<AppointmentDetailPage />)} />
      <Route path={ROUTES.ADMIN_PANCHAKARMA} element={withSuspense(<PanchakarmaPage />)} />
      <Route path={ROUTES.ADMIN_PHARMACY} element={withSuspense(<PharmacyPage />)} />
      <Route path={ROUTES.ADMIN_STAFF} element={withSuspense(<StaffPage />)} />
      <Route path={ROUTES.ADMIN_STAFF_DETAIL} element={withSuspense(<StaffDetailPage />)} />
      <Route path={ROUTES.ADMIN_ANALYTICS} element={withSuspense(<AnalyticsPage />)} />
      <Route path={ROUTES.ADMIN_BILLING} element={withSuspense(<BillingPage />)} />
      <Route path={ROUTES.ADMIN_INVOICE_DETAIL} element={withSuspense(<InvoiceDetailPage />)} />
      <Route path={ROUTES.ADMIN_SETTINGS} element={withSuspense(<SettingsPage />)} />
      <Route path={ROUTES.ADMIN_MASTER_DATA} element={withSuspense(<MasterDataPage />)} />
    </Route>

    <Route path="*" element={<Navigate to={ROUTES.CUSTOMER_WELCOME} replace />} />
  </Routes>
);

export default AppRoutes;
