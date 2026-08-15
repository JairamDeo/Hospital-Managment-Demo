import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Link2, Loader2, QrCode, RefreshCw } from 'lucide-react';
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
  type RazorpayPaymentLinkResponse,
  type RazorpayQrResponse,
} from '@/types/billing.types';

interface Props {
  open: boolean;
  invoice: InvoiceDetail;
  onClose: () => void;
  onCollected: () => void | Promise<void>;
}

const OFFLINE_METHODS = [...OFFLINE_PAYMENT_METHOD_OPTIONS];

type PendingMode = 'qr' | 'payment_link';

const collectorName = (user: { name?: string; firstName?: string; lastName?: string } | null) =>
  user?.name?.trim() ||
  [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
  'Staff';

const methodLabel = (method: PaymentMethodType) => {
  if (method === 'Online') return 'UPI QR (patient scans)';
  if (method === 'Payment Link') return 'Payment link (SMS/WhatsApp to patient)';
  return method;
};

export const CollectPaymentModal = ({ open, invoice, onClose, onCollected }: Props) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('Cash');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [pendingMode, setPendingMode] = useState<PendingMode | null>(null);
  const [qrSession, setQrSession] = useState<RazorpayQrResponse | null>(null);
  const [linkSession, setLinkSession] = useState<RazorpayPaymentLinkResponse | null>(null);
  const [linkFailed, setLinkFailed] = useState(false);
  const [linkFailureReason, setLinkFailureReason] = useState('');
  const [successCollection, setSuccessCollection] = useState<PaymentCollectionSuccess | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const balance = invoice.balance ?? Math.max(0, invoice.amount - (invoice.paidAmount ?? 0));
  const allowPartial = balance > 0 && balance < invoice.amount;
  const isQr = paymentMethod === 'Online';
  const isPaymentLink = paymentMethod === 'Payment Link';
  const isOnlineFlow = isQr || isPaymentLink;
  const waitingForPatient = pendingMode !== null;
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
    setPendingMode(null);
    setQrSession(null);
    setLinkSession(null);
    setLinkFailed(false);
    setLinkFailureReason('');
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
    setPendingMode(null);
    setSubmitting(false);
    setLinkFailed(false);
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

  const startPaymentLinkPolling = (paymentLinkId: string) => {
    stopPolling();
    pollRef.current = setInterval(() => {
      void billingAdminService
        .getRazorpayPaymentLinkStatus(paymentLinkId)
        .then(({ data }) => {
          if (data.res?.status === 'paid' && data.res.collection) {
            void handleSuccess(data.res.collection);
            return;
          }
          if (data.res?.status === 'failed') {
            stopPolling();
            setLinkFailed(true);
            setLinkFailureReason(data.res.failureReason || 'Payment failed');
            setSubmitting(false);
          }
        })
        .catch(() => {});
    }, 4000);
  };

  if (!open) return null;

  const payAmount = Number(amount);
  const partialAmount = allowPartial || payAmount < balance ? payAmount : undefined;

  const validateAmount = () => {
    if (!Number.isFinite(payAmount) || payAmount <= 0) {
      showToast('Enter a valid payment amount', 'error');
      return false;
    }
    if (payAmount > balance) {
      showToast(`Amount cannot exceed balance of ${formatRupee(balance)}`, 'error');
      return false;
    }
    return true;
  };

  const handleOfflineCollect = async () => {
    if (!validateAmount()) return;

    setSubmitting(true);
    try {
      const { data } = await billingAdminService.collectPayment(
        invoice.id,
        paymentMethod as Exclude<PaymentMethodType, 'Online' | 'Payment Link'>,
        partialAmount
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
    if (!validateAmount()) return;

    setSubmitting(true);
    try {
      const { data } = await billingAdminService.createRazorpayQr(invoice.id, partialAmount);
      const qr = data.res?.qr;
      if (!qr?.qrCodeId || !qr.qrImageUrl) {
        showToast('Could not generate payment QR', 'error');
        setSubmitting(false);
        return;
      }
      setQrSession(qr);
      setLinkSession(null);
      setLinkFailed(false);
      setPendingMode('qr');
      setSubmitting(false);
      startQrPolling(qr.qrCodeId);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
      setSubmitting(false);
    }
  };

  const handleSendPaymentLink = async (retry = false) => {
    if (!validateAmount()) return;

    setSubmitting(true);
    setLinkFailed(false);
    setLinkFailureReason('');
    try {
      const { data } = retry
        ? await billingAdminService.retryRazorpayPaymentLink(invoice.id, partialAmount)
        : await billingAdminService.createRazorpayPaymentLink(invoice.id, partialAmount);
      const link = data.res?.paymentLink;
      if (!link?.paymentLinkId) {
        showToast('Could not send payment link', 'error');
        setSubmitting(false);
        return;
      }
      setLinkSession(link);
      setQrSession(null);
      setPendingMode('payment_link');
      setSubmitting(false);
      const parts: string[] = [];
      if (link.smsSent) parts.push('SMS');
      if (link.whatsappSent) parts.push('WhatsApp');
      if (link.emailSent) parts.push('Email');
      if (parts.length) {
        showToast(
          retry ? `New payment link sent via ${parts.join(' & ')}` : `Payment link sent via ${parts.join(' & ')}`,
          'success'
        );
      } else {
        showToast('Payment link created', 'success');
      }
      if (link.whatsappSkipped) {
        showToast('Patient does not have a WhatsApp number on file', 'info');
      }
      if (link.emailSkipped) {
        showToast('Patient does not have an email address on file', 'info');
      }
      startPaymentLinkPolling(link.paymentLinkId);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
      setSubmitting(false);
    }
  };

  const handlePrimaryAction = () => {
    if (isQr) void handleGenerateQr();
    else if (isPaymentLink) void handleSendPaymentLink(false);
    else void handleOfflineCollect();
  };

  const handleClose = () => {
    stopPolling();
    setSuccessCollection(null);
    onClose();
  };

  const methodOptions = razorpayEnabled ? PAYMENT_METHOD_OPTIONS : OFFLINE_METHODS;
  const pendingAmount =
    qrSession?.amount ?? linkSession?.amount ?? (payAmount || balance);

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
              <span className="font-semibold text-sage-deep">{formatRupee(pendingAmount)}</span>
            </div>
          )}

          {!waitingForPatient ? (
            <>
              {allowPartial || invoice.status === 'Partial' || isOnlineFlow ? (
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
                      {methodLabel(m)}
                    </option>
                  ))}
                </select>
              </label>

              {isQr ? (
                <p className="mt-2 text-[11px] leading-relaxed text-ink-ghost">
                  Generate a QR code with the exact amount. Show it to the patient — they pay from their
                  phone. You will see confirmation when payment is received.
                </p>
              ) : isPaymentLink ? (
                <p className="mt-2 text-[11px] leading-relaxed text-ink-ghost">
                  Sends a Razorpay payment link by SMS and WhatsApp (when patient has a WhatsApp
                  number) with the exact amount. Invoice stays pending until payment is completed.
                </p>
              ) : (
                <p className="mt-2 text-[11px] leading-relaxed text-ink-ghost">
                  Record cash or manual UPI/card payment received at the counter.
                </p>
              )}

              <div className="mt-5 flex gap-2">
                <Button onClick={handlePrimaryAction} disabled={submitting} className="gap-1.5">
                  {isQr ? (
                    <>
                      <QrCode className="h-4 w-4" />
                      {submitting ? 'Generating…' : 'Generate QR'}
                    </>
                  ) : isPaymentLink ? (
                    <>
                      <Link2 className="h-4 w-4" />
                      {submitting ? 'Sending…' : 'Send payment link'}
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
          ) : pendingMode === 'qr' && qrSession ? (
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
          ) : pendingMode === 'payment_link' && linkSession ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-border-sage bg-cream/30 p-4 text-center">
                <p className="text-sm font-semibold text-ink">Payment link sent</p>
                <p className="mt-2 text-xs text-ink-soft">
                  {linkSession.smsSent ? (
                    <>
                      SMS sent to{' '}
                      <span className="font-medium text-ink">{linkSession.patientMobileMasked}</span>
                    </>
                  ) : null}
                  {linkSession.smsSent && linkSession.whatsappSent ? ' · ' : null}
                  {linkSession.whatsappSent ? (
                    <span className="font-medium text-emerald-700">WhatsApp sent</span>
                  ) : null}
                  {linkSession.whatsappSkipped ? (
                    <span className="block mt-1 text-amber-700">
                      WhatsApp skipped — no WhatsApp number on file
                    </span>
                  ) : null}
                  {linkSession.emailSent ? (
                    <span className="block mt-1 text-emerald-700">Email sent</span>
                  ) : null}
                  {linkSession.emailSkipped ? (
                    <span className="block mt-1 text-amber-700">
                      Email skipped — no email address on file
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-lg font-semibold text-sage-deep">
                  {formatRupee(linkSession.amount)}
                </p>
                <p className="mt-2 text-[11px] text-ink-ghost">
                  Invoice remains <span className="font-semibold text-amber-700">Pending</span> until
                  the patient pays.
                </p>
              </div>

              {linkFailed ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-left">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    <div>
                      <p className="text-sm font-semibold text-red-800">Payment failed</p>
                      <p className="mt-1 text-xs text-red-700">
                        {linkFailureReason || 'Patient payment did not complete.'}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="mt-3 w-full gap-1.5"
                    onClick={() => void handleSendPaymentLink(true)}
                    disabled={submitting}
                  >
                    <RefreshCw className="h-4 w-4" />
                    {submitting ? 'Sending…' : 'Retry — send new link'}
                  </Button>
                </div>
              ) : (
                <div className="inline-flex w-full items-center justify-center gap-2 text-xs text-ink-soft">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-sage-deep" />
                  Waiting for patient payment…
                </div>
              )}

              <Button variant="secondary" onClick={handleClose} className="w-full">
                Close
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
