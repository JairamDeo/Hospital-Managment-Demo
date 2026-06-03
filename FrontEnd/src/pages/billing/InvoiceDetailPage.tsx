import { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { InvoiceProfileCard } from '@/components/billing/detail/InvoiceProfileCard';
import { InvoicePaymentCard } from '@/components/billing/detail/InvoicePaymentCard';
import { InvoiceAmountRow } from '@/components/billing/detail/InvoiceAmountRow';
import { InvoiceDetailTabs } from '@/components/billing/detail/InvoiceDetailTabs';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/constants/routes';
import { buildInvoiceDetail } from './data/mockInvoiceDetails';
import { MOCK_INVOICES } from './data/mockBilling';

export const InvoiceDetailPage = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { showToast } = useToast();

  const invoice = useMemo(() => {
    const base = MOCK_INVOICES.find((inv) => inv.id === invoiceId);
    return base ? buildInvoiceDetail(base) : null;
  }, [invoiceId]);

  if (!invoiceId || !invoice) {
    return <Navigate to={ROUTES.ADMIN_BILLING} replace />;
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] pb-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[300px] xl:w-[320px]">
          <InvoiceProfileCard
            invoice={invoice}
            onDownload={() => showToast(`Downloading ${invoice.id}`, 'success')}
            onSendReminder={() => showToast('Payment reminder sent', 'success')}
            onEdit={() => showToast('Invoice edit — coming soon', 'success')}
          />
          <InvoicePaymentCard invoice={invoice} />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-5">
          <InvoiceDetailTabs invoice={invoice} />
          <div>
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
              Amount Breakdown
            </h3>
            <InvoiceAmountRow invoice={invoice} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default InvoiceDetailPage;
