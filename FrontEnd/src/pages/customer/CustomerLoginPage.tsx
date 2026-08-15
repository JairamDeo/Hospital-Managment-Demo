import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerAuthShell } from '@/components/customer/layout/CustomerAuthShell';
import { patientPortalAuthService } from '@/services/auth/patientPortalAuth.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants/routes';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/utils/helpers';

export const CustomerLoginPage = () => {
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[0-9]{10}$/.test(mobile)) {
      setError('Enter 10-digit mobile number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await patientPortalAuthService.sendOtp(mobile);
      showToast(data.message, 'success');
      navigate(ROUTES.CUSTOMER_VERIFY_OTP, {
        state: { mobile, mode: 'login' as const, otpMeta: data.res },
      });
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerAuthShell
      title="Patient Login"
      subtitle="Sign in with your registered mobile"
      showBack
      backTo={ROUTES.CUSTOMER_WELCOME}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-border-sage bg-white p-5 shadow-sm"
      >
        <Input
          label="Mobile Number"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={mobile}
          onChange={(e) => {
            setMobile(e.target.value.replace(/\D/g, '').slice(0, 10));
            setError('');
          }}
          error={error}
          placeholder="10-digit mobile"
        />
        <Button type="submit" className="w-full" isLoading={loading}>
          Send OTP
        </Button>
      </form>
    </CustomerAuthShell>
  );
};

export default CustomerLoginPage;
