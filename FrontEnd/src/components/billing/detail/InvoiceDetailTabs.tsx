import { ClipboardList, History, ListOrdered } from 'lucide-react';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { InvoiceDetail, InvoiceDetailTab } from '@/types/billing.types';
import { InvoiceActivityItem } from './InvoiceActivityItem';
import { InvoiceLineItemsTab, InvoicePaymentsTab } from './tabs/InvoiceTabPanels';

const TABS: { id: InvoiceDetailTab; label: string; icon: LucideIcon }[] = [
  { id: 'items', label: 'Line Items', icon: ListOrdered },
  { id: 'payments', label: 'Payments', icon: ClipboardList },
  { id: 'activity', label: 'Activity', icon: History },
];

interface Props {
  invoice: InvoiceDetail;
}

export const InvoiceDetailTabs = ({ invoice }: Props) => {
  const [activeTab, setActiveTab] = useState<InvoiceDetailTab>('items');

  return (
    <div className="overflow-hidden rounded-2xl border border-border-sage bg-white shadow-sm">
      <div className="border-b border-border-sage bg-cream/40 px-3 py-3 sm:px-5">
        <div className="flex gap-1 overflow-x-auto scrollbar-thin rounded-xl bg-sage-mist/50 p-1">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:px-3.5 sm:text-sm ${
                  active
                    ? 'bg-white text-sage-deep shadow-sm ring-1 ring-border-sage/80'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {activeTab === 'items' ? <InvoiceLineItemsTab items={invoice.lineItems} /> : null}
        {activeTab === 'payments' ? (
          <InvoicePaymentsTab payments={invoice.paymentHistory} />
        ) : null}
        {activeTab === 'activity' ? (
          <div className="space-y-0">
            {invoice.activityLog.map((record, i) => (
              <InvoiceActivityItem
                key={record.id}
                record={record}
                isLast={i === invoice.activityLog.length - 1}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};
