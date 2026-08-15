import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formInputClass, formLabelClass, formSelectClass } from '@/components/ui/formStyles';
import { billingAdminService } from '@/services/billing/billingAdmin.service';
import { panchakarmaAdminService } from '@/services/panchakarma/panchakarmaAdmin.service';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/utils/helpers';
import { ROUTES, invoiceDetailPath } from '@/constants/routes';
import {
  formatRupee,
  OFFLINE_PAYMENT_METHOD_OPTIONS,
  type OfflinePaymentMethodType,
} from '@/types/billing.types';
import type { HmsPanchakarmaProgram } from '@/types/api.types';

export const PanchakarmaBillPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [programs, setPrograms] = useState<HmsPanchakarmaProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [programCode, setProgramCode] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<OfflinePaymentMethodType>('Cash');
  const [markPaid, setMarkPaid] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await panchakarmaAdminService.listPrograms();
      setPrograms(data.res?.programs ?? []);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const withBalance = useMemo(
    () =>
      programs.filter((p) => {
        const total = p.totalFees ?? 0;
        const paid = p.amountPaid ?? 0;
        return total > paid;
      }),
    [programs]
  );

  const selected = useMemo(
    () => withBalance.find((p) => p.programCode === programCode) ?? null,
    [withBalance, programCode]
  );

  const balance = selected
    ? Math.max(0, (selected.totalFees ?? 0) - (selected.amountPaid ?? 0))
    : 0;

  useEffect(() => {
    if (selected) setAmount(String(balance));
  }, [selected, balance]);

  const handlePay = async () => {
    if (!selected) {
      showToast('Select a program', 'error');
      return;
    }
    const payAmount = markPaid ? balance : Number(amount);
    if (!Number.isFinite(payAmount) || payAmount <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }
    if (payAmount > balance) {
      showToast(`Amount cannot exceed ${formatRupee(balance)}`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await billingAdminService.createPanchakarmaPayment({
        programCode: selected.programCode,
        amount: markPaid ? undefined : payAmount,
        paymentMethod,
        markPaid,
      });
      showToast('Panchakarma payment recorded', 'success');
      const invoiceId = data.res?.invoice?.id;
      if (invoiceId) navigate(invoiceDetailPath(invoiceId));
      else void load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl pb-8">
      <Link
        to={ROUTES.ADMIN_BILLING}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-sage-deep hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to billing
      </Link>

      <h1 className="font-serif text-2xl font-bold text-sage-deep">Panchakarma payment</h1>
      <p className="mt-1 text-sm text-ink-soft">Collect full or partial payment for treatment programs</p>

      {loading ? (
        <p className="py-16 text-center text-sm text-ink-soft">Loading programs…</p>
      ) : (
        <div className="mt-5 space-y-4 rounded-xl border border-border-sage bg-white p-5 shadow-sm">
          {withBalance.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-soft">No programs with balance due</p>
          ) : (
            <>
              <label className="block">
                <span className={formLabelClass}>Program</span>
                <select
                  value={programCode}
                  onChange={(e) => setProgramCode(e.target.value)}
                  className={formSelectClass}
                >
                  <option value="">Select program…</option>
                  {withBalance.map((p) => {
                    const bal = Math.max(0, (p.totalFees ?? 0) - (p.amountPaid ?? 0));
                    return (
                      <option key={p.programCode} value={p.programCode}>
                        {p.patientName} · {p.treatmentName || p.therapy} · {formatRupee(bal)} due
                      </option>
                    );
                  })}
                </select>
              </label>

              {selected ? (
                <>
                  <div className="rounded-lg bg-cream/40 px-4 py-3 text-sm">
                    <p className="font-medium text-ink">{selected.patientName}</p>
                    <p className="text-ink-soft">
                      {selected.treatmentName || selected.therapy} · {selected.totalDays} days
                    </p>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs">
                      <span>Total fees: {formatRupee(selected.totalFees ?? 0)}</span>
                      <span>Paid: {formatRupee(selected.amountPaid ?? 0)}</span>
                      <span className="font-semibold text-sage-deep">
                        Balance: {formatRupee(balance)}
                      </span>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={markPaid}
                      onChange={(e) => {
                        setMarkPaid(e.target.checked);
                        if (e.target.checked) setAmount(String(balance));
                      }}
                    />
                    Pay full balance now
                  </label>

                  {!markPaid ? (
                    <label className="block">
                      <span className={formLabelClass}>Partial amount (₹)</span>
                      <input
                        type="number"
                        min={0.01}
                        max={balance}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className={formInputClass}
                      />
                    </label>
                  ) : null}

                  <label className="block">
                    <span className={formLabelClass}>Payment method</span>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as OfflinePaymentMethodType)}
                      className={formSelectClass}
                    >
                      {OFFLINE_PAYMENT_METHOD_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </label>

                  <Button onClick={() => void handlePay()} disabled={submitting}>
                    Record payment{' '}
                    {markPaid ? formatRupee(balance) : formatRupee(Number(amount) || 0)}
                  </Button>
                </>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PanchakarmaBillPage;
