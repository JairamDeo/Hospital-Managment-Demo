import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { InvoiceProfileCard } from '@/components/billing/detail/InvoiceProfileCard';
import { InvoicePaymentCard } from '@/components/billing/detail/InvoicePaymentCard';
import { InvoiceAmountRow } from '@/components/billing/detail/InvoiceAmountRow';
import { InvoiceDetailTabs } from '@/components/billing/detail/InvoiceDetailTabs';
import { CollectPaymentModal } from '@/components/billing/CollectPaymentModal';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/constants/routes';
import { billingAdminService } from '@/services/billing/billingAdmin.service';
import { getApiErrorMessage } from '@/utils/helpers';
import type { InvoiceDetail } from '@/types/billing.types';

export const InvoiceDetailPage = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { showToast } = useToast();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [collectOpen, setCollectOpen] = useState(false);

  const load = async () => {
    if (!invoiceId) return;
    setLoading(true);
    try {
      const { data } = await billingAdminService.get(invoiceId);
      setInvoice(data.res?.invoice ?? null);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [invoiceId]);

  if (!invoiceId) {
    return <Navigate to={ROUTES.ADMIN_BILLING} replace />;
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-ink-soft">Loading invoice…</div>
    );
  }

  if (!invoice) {
    return <Navigate to={ROUTES.ADMIN_BILLING} replace />;
  }

  const handleCollected = async () => {
    await load();
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] pb-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[300px] xl:w-[320px]">
          <InvoiceProfileCard
            invoice={invoice}
            onCollect={() => setCollectOpen(true)}
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

      <CollectPaymentModal
        open={collectOpen}
        invoice={invoice}
        onClose={() => setCollectOpen(false)}
        onCollected={handleCollected}
      />
    </div>
  );
};

export default InvoiceDetailPage;
