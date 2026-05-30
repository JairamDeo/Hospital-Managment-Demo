import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PageLoader } from '@/components/ui/Loader';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute, PublicOnlyRoute } from './ProtectedRoute';
import { ROUTES } from '@/constants/routes';

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

const withSuspense = (el: React.ReactNode) => (
  <Suspense fallback={<PageLoader />}>{el}</Suspense>
);

export const AppRoutes = () => (
  <Routes>
    <Route
      path={ROUTES.LOGIN}
      element={withSuspense(
        <PublicOnlyRoute>
          <LoginPage />
        </PublicOnlyRoute>
      )}
    />
    <Route
      path={ROUTES.FORGOT_PASSWORD}
      element={withSuspense(
        <PublicOnlyRoute>
          <ForgotPasswordPage />
        </PublicOnlyRoute>
      )}
    />
    <Route path={ROUTES.ACCESS_DENIED} element={withSuspense(<AccessDeniedPage />)} />

    <Route
      element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }
    >
      <Route path={ROUTES.DASHBOARD} element={withSuspense(<DashboardPage />)} />
      <Route path={ROUTES.PATIENTS} element={withSuspense(<PatientsPage />)} />
      <Route path={ROUTES.PATIENT_DETAIL} element={withSuspense(<PatientDetailPage />)} />
      <Route path={ROUTES.APPOINTMENTS} element={withSuspense(<AppointmentsPage />)} />
      <Route path={ROUTES.APPOINTMENT_DETAIL} element={withSuspense(<AppointmentDetailPage />)} />
      <Route path={ROUTES.PANCHAKARMA} element={withSuspense(<PanchakarmaPage />)} />
      <Route path={ROUTES.PHARMACY} element={withSuspense(<PharmacyPage />)} />
      <Route path={ROUTES.STAFF} element={withSuspense(<StaffPage />)} />
      <Route path={ROUTES.STAFF_DETAIL} element={withSuspense(<StaffDetailPage />)} />
      <Route path={ROUTES.ANALYTICS} element={withSuspense(<AnalyticsPage />)} />
      <Route path={ROUTES.BILLING} element={withSuspense(<BillingPage />)} />
      <Route path={ROUTES.INVOICE_DETAIL} element={withSuspense(<InvoiceDetailPage />)} />
      <Route path={ROUTES.SETTINGS} element={withSuspense(<SettingsPage />)} />
    </Route>

    <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
  </Routes>
);

export default AppRoutes;
