import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Props {
  password: string;
  confirm: string;
  setPassword: (v: string) => void;
  setConfirm: (v: string) => void;
  errors: { password?: string; confirm?: string };
  loading: boolean;
  onSubmit: () => void;
}

export const NewPasswordStep = ({
  password,
  confirm,
  setPassword,
  setConfirm,
  errors,
  loading,
  onSubmit,
}: Props) => (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }}
    className="space-y-5"
  >
    <Input
      label="New Password"
      type="password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      error={errors.password}
      placeholder="Min. 8 characters"
    />
    <Input
      label="Confirm Password"
      type="password"
      value={confirm}
      onChange={(e) => setConfirm(e.target.value)}
      error={errors.confirm}
      placeholder="Re-enter password"
    />
    <Button type="submit" className="w-full" isLoading={loading}>
      Reset Password
    </Button>
  </form>
);
