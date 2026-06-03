import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { EnterMobileStep } from './steps/EnterMobileStep';
import { VerifyOtpStep } from './steps/VerifyOtpStep';
import { NewPasswordStep } from './steps/NewPasswordStep';
import { authService } from '@/services/auth/authService';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/constants/routes';
import { getApiErrorMessage } from '@/utils/helpers';
import type { ForgotPasswordStep } from '@/types/auth.types';
import { ArrowLeft } from 'lucide-react';

const stepTitles: Record<ForgotPasswordStep, { title: string; subtitle: string }> = {
  mobile: {
    title: 'Forgot Password',
    subtitle: 'Enter your registered mobile number',
  },
  otp: {
    title: 'Verify OTP',
    subtitle: 'Enter the 4-digit code sent to your mobile',
  },
  password: {
    title: 'New Password',
    subtitle: 'Create a strong new password',
  },
};

export const ForgotPasswordPage = () => {
  const [step, setStep] = useState<ForgotPasswordStep>('mobile');
  const [mobile, setMobile] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [mobileError, setMobileError] = useState<string>();
  const [pwdErrors, setPwdErrors] = useState<{ password?: string; confirm?: string }>({});
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otpMeta, setOtpMeta] = useState({ expiresInSeconds: 120, resendAfterSeconds: 30 });
  const { showToast } = useToast();
  const navigate = useNavigate();

  const applyOtpMeta = (res: { expiresInSeconds?: number; resendAfterSeconds?: number } | null) => {
    if (res?.expiresInSeconds) {
      setOtpMeta({
        expiresInSeconds: res.expiresInSeconds,
        resendAfterSeconds: res.resendAfterSeconds ?? 30,
      });
    }
  };

  const meta = stepTitles[step];

  const sendOtp = async () => {
    if (!/^[0-9]{10}$/.test(mobile)) {
      setMobileError('Enter a valid 10-digit mobile number');
      return;
    }
    setMobileError(undefined);
    setLoading(true);
    try {
      const { data } = await authService.sendForgotOtp(mobile);
      applyOtpMeta(data.res);
      showToast(data.message, 'success');
      setStep('otp');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setResendLoading(true);
    try {
      const { data } = await authService.resendForgotOtp(mobile);
      applyOtpMeta(data.res);
      showToast(data.message || 'New OTP sent', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setResendLoading(false);
    }
  };

  const verifyOtp = async (otp: string) => {
    setLoading(true);
    try {
      const { data } = await authService.verifyForgotOtp(mobile, otp);
      if (!data.res?.resetToken) throw new Error('Verification failed');
      setResetToken(data.res.resetToken);
      showToast(data.message, 'success');
      setStep('password');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Invalid or expired OTP'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    const next: typeof pwdErrors = {};
    if (password.length < 8) next.password = 'Password must be at least 8 characters';
    if (password !== confirm) next.confirm = 'Passwords do not match';
    setPwdErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const { data } = await authService.resetPassword(resetToken, password, confirm);
      showToast(data.message || 'Password reset successfully', 'success');
      setTimeout(() => navigate(ROUTES.ADMIN_LOGIN), 500);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={meta.title} subtitle={meta.subtitle}>
      <Link
        to={step === 'mobile' ? ROUTES.ADMIN_LOGIN : '#'}
        onClick={(e) => {
          if (step === 'otp') {
            e.preventDefault();
            setStep('mobile');
          } else if (step === 'password') {
            e.preventDefault();
            setStep('otp');
          }
        }}
        className="mb-4 inline-flex items-center gap-1 text-sm text-sage-deep hover:text-sage-mid"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {step === 'mobile' && (
        <EnterMobileStep
          mobile={mobile}
          setMobile={setMobile}
          error={mobileError}
          loading={loading}
          onSubmit={sendOtp}
        />
      )}
      {step === 'otp' && (
        <VerifyOtpStep
          mobile={mobile}
          loading={loading}
          resendLoading={resendLoading}
          expiresInSeconds={otpMeta.expiresInSeconds}
          resendAfterSeconds={otpMeta.resendAfterSeconds}
          onVerify={verifyOtp}
          onResend={resendOtp}
        />
      )}
      {step === 'password' && (
        <NewPasswordStep
          password={password}
          confirm={confirm}
          setPassword={setPassword}
          setConfirm={setConfirm}
          errors={pwdErrors}
          loading={loading}
          onSubmit={resetPassword}
        />
      )}
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
