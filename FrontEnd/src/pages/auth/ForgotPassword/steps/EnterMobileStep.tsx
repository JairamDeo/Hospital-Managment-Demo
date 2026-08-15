import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Props {
  mobile: string;
  setMobile: (v: string) => void;
  error?: string;
  loading: boolean;
  onSubmit: () => void;
}

export const EnterMobileStep = ({ mobile, setMobile, error, loading, onSubmit }: Props) => (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }}
    className="space-y-5"
  >
    <Input
      label="Mobile Number"
      type="tel"
      inputMode="numeric"
      maxLength={10}
      placeholder="10-digit mobile number"
      value={mobile}
      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
      error={error}
    />
    <Button type="submit" className="w-full" isLoading={loading}>
      Send OTP
    </Button>
  </form>
);
