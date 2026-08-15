import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formInputClass, formLabelClass, formSelectClass } from '@/components/ui/formStyles';
import { billingAdminService } from '@/services/billing/billingAdmin.service';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/utils/helpers';
import { ROUTES, invoiceDetailPath } from '@/constants/routes';
import { formatRupee, OFFLINE_PAYMENT_METHOD_OPTIONS, type Invoice, type OfflinePaymentMethodType } from '@/types/billing.types';

export const ConsultationBillPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<OfflinePaymentMethodType>('Cash');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await billingAdminService.list({ feeType: 'Consultation', status: 'pending' });
      const rows = data.res?.invoices ?? [];
      setInvoices(rows.filter((inv) => inv.status === 'Pending' || inv.status === 'Partial' || inv.status === 'Overdue'));
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(
    () => invoices.find((inv) => inv.id === selectedCode) ?? null,
    [invoices, selectedCode]
  );

  const balance = selected
    ? selected.balance ?? Math.max(0, selected.amount - (selected.amountPaid ?? 0))
    : 0;

  useEffect(() => {
    if (selected) setAmount(String(balance));
  }, [selected, balance]);

  const handleCollect = async () => {
    if (!selected) {
      showToast('Select an invoice', 'error');
      return;
    }
    const payAmount = Number(amount);
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
      await billingAdminService.collectPayment(
        selected.id,
        paymentMethod,
        payAmount < balance ? payAmount : undefined
      );
      showToast('Payment collected', 'success');
      navigate(invoiceDetailPath(selected.id));
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

      <h1 className="font-serif text-2xl font-bold text-sage-deep">Collect consultation fee</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Select a pending or partial consultation invoice and record payment
      </p>

      {loading ? (
        <p className="py-16 text-center text-sm text-ink-soft">Loading invoices…</p>
      ) : (
        <div className="mt-5 space-y-4 rounded-xl border border-border-sage bg-white p-5 shadow-sm">
          {invoices.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-soft">No pending consultation invoices</p>
          ) : (
            <>
              <label className="block">
                <span className={formLabelClass}>Invoice</span>
                <select
                  value={selectedCode}
                  onChange={(e) => setSelectedCode(e.target.value)}
                  className={formSelectClass}
                >
                  <option value="">Select invoice…</option>
                  {invoices.map((inv) => {
                    const bal = inv.balance ?? Math.max(0, inv.amount - (inv.amountPaid ?? 0));
                    return (
                      <option key={inv.id} value={inv.id}>
                        #{inv.id} · {inv.patientName} · {formatRupee(bal)} due ({inv.status})
                      </option>
                    );
                  })}
                </select>
              </label>

              {selected ? (
                <>
                  <div className="rounded-lg bg-cream/40 px-4 py-3 text-sm">
                    <p className="font-medium text-ink">{selected.patientName}</p>
                    <p className="text-ink-soft">{selected.treatment}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs">
                      <span>Total: {formatRupee(selected.amount)}</span>
                      <span>Balance: {formatRupee(balance)}</span>
                      {selected.status === 'Partial' ? (
                        <span className="text-blue-700">Partial payment</span>
                      ) : null}
                    </div>
                  </div>

                  <label className="block">
                    <span className={formLabelClass}>Amount to collect (₹)</span>
                    <input
                      type="number"
                      min={0.01}
                      max={balance}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={formInputClass}
                    />
                  </label>

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

                  <Button onClick={() => void handleCollect()} disabled={submitting}>
                    Collect {amount ? formatRupee(Number(amount) || 0) : 'payment'}
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

export default ConsultationBillPage;
