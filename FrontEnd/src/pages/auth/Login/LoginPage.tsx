import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/constants/routes';
import { getApiErrorMessage } from '@/utils/helpers';
import { defaultLandingRoute } from '@/utils/navPermissions';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = 'Enter a valid email';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { message, user: profile } = await login(email.trim().toLowerCase(), password);
      showToast(message || 'Login successful', 'success');
      const isAdmin = profile?.accountType === 'admin' || profile?.role === 'admin';
      navigate(defaultLandingRoute(profile?.permissions, isAdmin, profile?.staffCode), {
        replace: true,
      });
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Invalid email or password'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Staff & Admin Sign In"
      subtitle="Hospital Management System — staff and administrator access"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <PasswordInput
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <div className="flex justify-end">
          <Link
            to={ROUTES.ADMIN_FORGOT_PASSWORD}
            className="text-sm font-medium text-sage-deep hover:text-sage-mid"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" isLoading={loading}>
          Sign In
        </Button>
        <p className="text-center text-xs text-ink-ghost">
          Patient portal?{' '}
          <Link to={ROUTES.CUSTOMER_WELCOME} className="font-semibold text-sage-deep hover:underline">
            Patient login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
