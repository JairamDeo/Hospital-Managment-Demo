import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { OTP_LENGTH } from '@/constants/constants';

interface Props {
  mobile: string;
  loading: boolean;
  resendLoading: boolean;
  expiresInSeconds: number;
  resendAfterSeconds: number;
  onVerify: (otp: string) => void;
  onResend: () => void;
  onTimersReset?: () => void;
}

export const VerifyOtpStep = ({
  mobile,
  loading,
  resendLoading,
  expiresInSeconds,
  resendAfterSeconds,
  onVerify,
  onResend,
}: Props) => {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpTimer, setOtpTimer] = useState(expiresInSeconds);
  const [resendTimer, setResendTimer] = useState(resendAfterSeconds);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setOtpTimer(expiresInSeconds);
    setResendTimer(resendAfterSeconds);
  }, [expiresInSeconds, resendAfterSeconds]);

  useEffect(() => {
    const t = setInterval(() => {
      setOtpTimer((s) => (s > 0 ? s - 1 : 0));
      setResendTimer((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = pasted.split('').concat(Array(OTP_LENGTH).fill('')).slice(0, OTP_LENGTH);
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleResend = async () => {
    await onResend();
    setDigits(Array(OTP_LENGTH).fill(''));
    setOtpTimer(expiresInSeconds);
    setResendTimer(resendAfterSeconds);
    inputsRef.current[0]?.focus();
  };

  const otp = digits.join('');
  const canResend = resendTimer === 0 && !resendLoading;

  return (
    <div className="space-y-6">
      <p className="text-center text-sm text-ink-soft">
        OTP sent to <span className="font-medium text-ink">+91 {mobile}</span>
      </p>
      <div className="flex justify-center gap-3" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="h-12 w-12 rounded-btn border border-border-sage text-center text-lg font-semibold text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage-pale"
          />
        ))}
      </div>
      <p className="text-center text-xs text-ink-ghost">
        {otpTimer > 0 ? (
          <>
            OTP valid for {Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, '0')}
          </>
        ) : (
          <span className="text-danger">
            OTP expired — resend or use your test OTP if configured
          </span>
        )}
      </p>
      <Button
        type="button"
        className="w-full"
        isLoading={loading}
        disabled={otp.length !== OTP_LENGTH}
        onClick={() => onVerify(otp)}
      >
        Verify OTP
      </Button>
      <button
        type="button"
        disabled={!canResend}
        onClick={handleResend}
        className="w-full text-center text-sm font-medium text-sage-deep disabled:cursor-not-allowed disabled:text-ink-ghost"
      >
        {resendLoading
          ? 'Sending...'
          : canResend
            ? 'Resend OTP'
            : `Resend OTP in ${resendTimer}s`}
      </button>
    </div>
  );
};
