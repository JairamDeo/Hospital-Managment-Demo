import { useEffect, useRef, useState } from 'react';
import { Loader2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PaymentSuccessModal } from '@/components/billing/PaymentSuccessModal';
import { RazorpayQrCrop } from '@/components/billing/RazorpayQrCrop';
import { billingAdminService } from '@/services/billing/billingAdmin.service';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/utils/helpers';
import {
  feeTypeDisplayLabel,
  formatRupee,
  OFFLINE_PAYMENT_METHOD_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  type InvoiceDetail,
  type PaymentCollectionSuccess,
  type PaymentMethodType,
  type RazorpayQrResponse,
} from '@/types/billing.types';

interface Props {
  open: boolean;
  invoice: InvoiceDetail;
  onClose: () => void;
  onCollected: () => void | Promise<void>;
}

const OFFLINE_METHODS = [...OFFLINE_PAYMENT_METHOD_OPTIONS];

const collectorName = (user: { name?: string; firstName?: string; lastName?: string } | null) =>
  user?.name?.trim() ||
  [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
  'Staff';

export const CollectPaymentModal = ({ open, invoice, onClose, onCollected }: Props) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('Cash');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [qrSession, setQrSession] = useState<RazorpayQrResponse | null>(null);
  const [waitingForPatient, setWaitingForPatient] = useState(false);
  const [successCollection, setSuccessCollection] = useState<PaymentCollectionSuccess | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const balance = invoice.balance ?? Math.max(0, invoice.amount - (invoice.paidAmount ?? 0));
  const allowPartial = balance > 0 && balance < invoice.amount;
  const isOnline = paymentMethod === 'Online';
  const staffName = collectorName(user);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const resetState = () => {
    stopPolling();
    setPaymentMethod('Cash');
    setAmount(String(balance));
    setQrSession(null);
    setWaitingForPatient(false);
    setSubmitting(false);
  };

  useEffect(() => {
    if (!open) {
      stopPolling();
      return;
    }
    resetState();
    billingAdminService
      .getRazorpayConfig()
      .then(({ data }) => setRazorpayEnabled(Boolean(data.res?.razorpay?.enabled)))
      .catch(() => setRazorpayEnabled(false));
    return stopPolling;
  }, [open, balance]);

  const handleSuccess = async (collection: PaymentCollectionSuccess) => {
    stopPolling();
    setWaitingForPatient(false);
    setSubmitting(false);
    setSuccessCollection(collection);
    await onCollected();
  };

  const startQrPolling = (qrCodeId: string) => {
    stopPolling();
    pollRef.current = setInterval(() => {
      void billingAdminService
        .getRazorpayStatus(qrCodeId)
        .then(({ data }) => {
          if (data.res?.status === 'paid' && data.res.collection) {
            void handleSuccess(data.res.collection);
          }
        })
        .catch(() => {});
    }, 3000);
  };

  if (!open) return null;

  const payAmount = Number(amount);

  const handleOfflineCollect = async () => {
    if (!Number.isFinite(payAmount) || payAmount <= 0) {
      showToast('Enter a valid payment amount', 'error');
      return;
    }
    if (payAmount > balance) {
      showToast(`Amount cannot exceed balance of ${formatRupee(balance)}`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await billingAdminService.collectPayment(
        invoice.id,
        paymentMethod as Exclude<PaymentMethodType, 'Online'>,
        allowPartial || payAmount < balance ? payAmount : undefined
      );
      const collection =
        data.res?.collection ??
        ({
          invoiceCode: invoice.id,
          patientCode: invoice.patientCode,
          patientName: invoice.patientName,
          feeType: invoice.feeType,
          feeTypeLabel: feeTypeDisplayLabel(invoice.feeType),
          treatment: invoice.treatment,
          doctorName: invoice.doctorName || invoice.doctor || '',
          description: invoice.treatment,
          amount: payAmount,
          paymentMethod,
          collectedBy: staffName,
          status: data.res?.invoice?.status ?? 'Paid',
        } satisfies PaymentCollectionSuccess);
      await handleSuccess(collection);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
      setSubmitting(false);
    }
  };

  const handleGenerateQr = async () => {
    if (!Number.isFinite(payAmount) || payAmount <= 0) {
      showToast('Enter a valid payment amount', 'error');
      return;
    }
    if (payAmount > balance) {
      showToast(`Amount cannot exceed balance of ${formatRupee(balance)}`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await billingAdminService.createRazorpayQr(
        invoice.id,
        allowPartial || payAmount < balance ? payAmount : undefined
      );
      const qr = data.res?.qr;
      if (!qr?.qrCodeId || !qr.qrImageUrl) {
        showToast('Could not generate payment QR', 'error');
        setSubmitting(false);
        return;
      }
      setQrSession(qr);
      setWaitingForPatient(true);
      setSubmitting(false);
      startQrPolling(qr.qrCodeId);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    stopPolling();
    setSuccessCollection(null);
    onClose();
  };

  const methodOptions = razorpayEnabled ? PAYMENT_METHOD_OPTIONS : OFFLINE_METHODS;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button type="button" className="absolute inset-0 bg-ink/40" onClick={handleClose} aria-label="Close" />
        <div className="relative max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-border-sage bg-white p-4 shadow-xl sm:p-5">
          <h2 className="font-serif text-lg font-semibold text-ink">Collect payment from patient</h2>
          <p className="mt-1 text-xs text-ink-ghost">
            Collected by <span className="font-medium text-ink-soft">{staffName}</span>
          </p>

          {!waitingForPatient ? (
            <div className="mt-4 rounded-xl border border-border-sage bg-cream/30 p-3 text-sm">
            <p className="font-medium text-ink">{invoice.patientName}</p>
            <p className="mt-1 text-xs text-ink-soft">
              #{invoice.id} · {feeTypeDisplayLabel(invoice.feeType)}
            </p>
            {invoice.treatment ? (
              <p className="mt-1 text-xs text-ink-ghost">{invoice.treatment}</p>
            ) : null}
            {invoice.doctorName || invoice.doctor ? (
              <p className="mt-1 text-xs text-ink-ghost">
                Doctor: {invoice.doctorName || invoice.doctor}
              </p>
            ) : null}
            <p className="mt-2 text-base font-semibold text-sage-deep">
              Collect: {formatRupee(payAmount || balance)}
            </p>
          </div>
          ) : (
            <div className="mt-3 rounded-xl border border-border-sage bg-cream/30 px-3 py-2 text-xs text-ink-soft">
              <span className="font-medium text-ink">{invoice.patientName}</span>
              <span className="mx-1">·</span>
              {feeTypeDisplayLabel(invoice.feeType)}
              <span className="mx-1">·</span>
              <span className="font-semibold text-sage-deep">
                {formatRupee(qrSession?.amount ?? (payAmount || balance))}
              </span>
            </div>
          )}

          {!waitingForPatient ? (
            <>
              {allowPartial || invoice.status === 'Partial' || isOnline ? (
                <label className="mt-4 block">
                  <span className="mb-1 block text-xs font-semibold text-ink-ghost">
                    Amount to collect (₹)
                  </span>
                  <input
                    type="number"
                    min={0.01}
                    max={balance}
                    step={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg border border-border-sage px-3 py-2 text-sm"
                  />
                </label>
              ) : null}

              <label className="mt-4 block">
                <span className="mb-1 block text-xs font-semibold text-ink-ghost">Payment method</span>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                  className="w-full rounded-lg border border-border-sage px-3 py-2 text-sm"
                >
                  {methodOptions.map((m) => (
                    <option key={m} value={m}>
                      {m === 'Online' ? 'UPI QR (patient scans)' : m}
                    </option>
                  ))}
                </select>
              </label>

              {isOnline ? (
                <p className="mt-2 text-[11px] leading-relaxed text-ink-ghost">
                  Generate a QR code with the exact amount. Show it to the patient — they pay from their
                  phone. You will see confirmation when payment is received.
                </p>
              ) : (
                <p className="mt-2 text-[11px] leading-relaxed text-ink-ghost">
                  Record cash or manual UPI/card payment received at the counter.
                </p>
              )}

              <div className="mt-5 flex gap-2">
                <Button
                  onClick={() => (isOnline ? void handleGenerateQr() : void handleOfflineCollect())}
                  disabled={submitting}
                  className="gap-1.5"
                >
                  {isOnline ? (
                    <>
                      <QrCode className="h-4 w-4" />
                      {submitting ? 'Generating…' : 'Generate QR'}
                    </>
                  ) : (
                    'Confirm collection'
                  )}
                </Button>
                <Button variant="secondary" onClick={handleClose} disabled={submitting}>
                  Cancel
                </Button>
              </div>
            </>
          ) : qrSession ? (
            <div className="mt-4 space-y-3 text-center">
              <p className="text-sm font-semibold text-ink">Ask patient to scan & pay</p>
              <RazorpayQrCrop src={qrSession.qrImageUrl} size={280} />
              <div className="inline-flex items-center gap-2 text-xs text-ink-soft">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-sage-deep" />
                Waiting for patient payment…
              </div>
              <Button variant="secondary" onClick={handleClose} className="w-full">
                Cancel
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <PaymentSuccessModal
        open={Boolean(successCollection)}
        collection={successCollection}
        onClose={() => {
          setSuccessCollection(null);
          handleClose();
        }}
      />
    </>
  );
};
