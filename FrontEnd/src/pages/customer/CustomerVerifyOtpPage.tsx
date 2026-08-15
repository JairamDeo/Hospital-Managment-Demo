import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CustomerAuthShell } from '@/components/customer/layout/CustomerAuthShell';
import { VerifyOtpStep } from '@/pages/auth/ForgotPassword/steps/VerifyOtpStep';
import { patientPortalAuthService } from '@/services/auth/patientPortalAuth.service';
import { usePatientPortalAuth } from '@/hooks/usePatientPortalAuth';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/constants/routes';
import { getApiErrorMessage } from '@/utils/helpers';
import { OTP_RESEND_SECONDS, OTP_VALIDITY_SECONDS } from '@/constants/constants';
import type { OtpMeta } from '@/types/api.types';

type LocationState = {
  mobile: string;
  mode: 'login' | 'register';
  otpMeta?: OtpMeta;
};

export const CustomerVerifyOtpPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { persistSession } = usePatientPortalAuth();
  const { showToast } = useToast();
  const state = location.state as LocationState | null;
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otpMeta, setOtpMeta] = useState({
    expiresInSeconds: state?.otpMeta?.expiresInSeconds ?? OTP_VALIDITY_SECONDS,
    resendAfterSeconds: state?.otpMeta?.resendAfterSeconds ?? OTP_RESEND_SECONDS,
  });

  if (!state?.mobile) {
    return <Navigate to={ROUTES.CUSTOMER_WELCOME} replace />;
  }

  const backTo =
    state.mode === 'register' ? ROUTES.CUSTOMER_REGISTER : ROUTES.CUSTOMER_LOGIN;

  const handleVerify = async (otp: string) => {
    setLoading(true);
    try {
      const { data } = await patientPortalAuthService.verifyOtp(state.mobile, otp);
      if (!data.res?.token || !data.res?.patient) {
        throw new Error('Verification failed');
      }
      persistSession(data.res.token, data.res.patient);
      showToast(data.message || 'Welcome!', 'success');
      navigate(ROUTES.CUSTOMER_HOME, { replace: true });
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const { data } = await patientPortalAuthService.resendOtp(state.mobile);
      if (data.res) {
        setOtpMeta({
          expiresInSeconds: data.res.expiresInSeconds,
          resendAfterSeconds: data.res.resendAfterSeconds,
        });
      }
      showToast(data.message || 'OTP resent', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <CustomerAuthShell
      title="Verify OTP"
      subtitle="Enter the code sent to your mobile"
      showBack
      backTo={backTo}
    >
      <div className="rounded-2xl border border-border-sage bg-white p-5 shadow-sm">
        <VerifyOtpStep
          mobile={state.mobile}
          loading={loading}
          resendLoading={resendLoading}
          expiresInSeconds={otpMeta.expiresInSeconds}
          resendAfterSeconds={otpMeta.resendAfterSeconds}
          onVerify={handleVerify}
          onResend={handleResend}
        />
      </div>
    </CustomerAuthShell>
  );
};

export default CustomerVerifyOtpPage;
