import { MOCK_INVOICES, type Invoice } from './mockBilling';

export interface InvoiceLineItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface PaymentRecord {
  id: string;
  date: string;
  method: string;
  amount: number;
  reference: string;
  status: 'Completed' | 'Pending' | 'Failed';
}

export interface InvoiceActivity {
  id: string;
  title: string;
  date: string;
  description: string;
  actor: string;
}

export interface InvoiceDocument {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  size: string;
}

export type InvoiceDetailTab = 'items' | 'payments' | 'activity' | 'insurance' | 'documents';

export interface InvoiceDetail extends Invoice {
  dueDate: string;
  doctor: string;
  paymentMethod?: string;
  paidAmount: number;
  balance: number;
  tax: number;
  discount: number;
  subtotal: number;
  lineItems: InvoiceLineItem[];
  paymentHistory: PaymentRecord[];
  activityLog: InvoiceActivity[];
  documents: InvoiceDocument[];
  insuranceProvider?: string;
  insuranceClaimId?: string;
  insuranceStatus?: 'Approved' | 'Pending' | 'Not Applicable';
}

const DETAIL_OVERRIDES: Record<string, Partial<Omit<InvoiceDetail, keyof Invoice>>> = {
  'INV-1024': {
    dueDate: 'Nov 5, 2023',
    doctor: 'Dr. Ananya Sharma',
    paymentMethod: 'UPI / QR',
    paidAmount: 12500,
    balance: 0,
    tax: 625,
    discount: 500,
    subtotal: 12375,
    insuranceProvider: 'Star Health',
    insuranceClaimId: 'SH-2023-8841',
    insuranceStatus: 'Approved',
    lineItems: [
      { id: 'li-1', description: 'Panchakarma — Vamana (Day 1–7)', qty: 7, rate: 1500, amount: 10500 },
      { id: 'li-2', description: 'Herbal Medicines Pack', qty: 1, rate: 1200, amount: 1200 },
      { id: 'li-3', description: 'Consultation Fee', qty: 1, rate: 800, amount: 800 },
    ],
    paymentHistory: [
      { id: 'pay-1', date: 'Oct 26, 2023', method: 'UPI / QR', amount: 12500, reference: 'UPI-8849201', status: 'Completed' },
    ],
    activityLog: [
      { id: 'act-1', title: 'Invoice Paid', date: 'Oct 26, 2023 · 2:15 PM', description: 'Full payment received via UPI. Receipt generated.', actor: 'Amit Verma' },
      { id: 'act-2', title: 'Invoice Generated', date: 'Oct 26, 2023 · 10:00 AM', description: 'Invoice created after Panchakarma session completion.', actor: 'System' },
      { id: 'act-3', title: 'Insurance Pre-auth', date: 'Oct 25, 2023', description: 'Star Health pre-authorization approved for ₹8,000.', actor: 'Suresh Iyer' },
    ],
    documents: [
      { id: 'doc-1', name: 'Invoice INV-1024.pdf', type: 'Invoice', uploadedAt: 'Oct 26, 2023', size: '186 KB' },
      { id: 'doc-2', name: 'Payment Receipt.pdf', type: 'Receipt', uploadedAt: 'Oct 26, 2023', size: '98 KB' },
      { id: 'doc-3', name: 'Insurance Claim Form.pdf', type: 'Insurance', uploadedAt: 'Oct 25, 2023', size: '245 KB' },
    ],
  },
};

const defaultLineItems = (inv: Invoice): InvoiceLineItem[] => {
  const consultRate = Math.round(inv.amount * 0.25);
  const treatmentRate = inv.amount - consultRate;
  return [
    {
      id: `${inv.id}-li-1`,
      description: inv.treatment,
      qty: 1,
      rate: treatmentRate,
      amount: treatmentRate,
    },
    {
      id: `${inv.id}-li-2`,
      description: 'Consultation & Review',
      qty: 1,
      rate: consultRate,
      amount: consultRate,
    },
  ];
};

const defaultPaymentHistory = (inv: Invoice): PaymentRecord[] => {
  if (inv.status === 'Paid') {
    return [
      {
        id: `${inv.id}-pay-1`,
        date: inv.date,
        method: 'UPI / QR',
        amount: inv.amount,
        reference: `UPI-${inv.id.slice(-4)}`,
        status: 'Completed',
      },
    ];
  }
  if (inv.status === 'Pending') {
    return [
      {
        id: `${inv.id}-pay-1`,
        date: inv.date,
        method: 'Pending',
        amount: 0,
        reference: '—',
        status: 'Pending',
      },
    ];
  }
  return [];
};

const defaultActivity = (inv: Invoice): InvoiceActivity[] => [
  {
    id: `${inv.id}-act-1`,
    title: `Invoice ${inv.status}`,
    date: inv.date,
    description: `${inv.treatment} invoice for ${inv.patientName}. Amount: ₹${inv.amount.toLocaleString('en-IN')}.`,
    actor: 'Billing System',
  },
  {
    id: `${inv.id}-act-2`,
    title: 'Invoice Created',
    date: inv.date,
    description: `Invoice generated for ${inv.treatment} session.`,
    actor: 'System',
  },
];

const defaultDocuments = (inv: Invoice): InvoiceDocument[] => [
  {
    id: `${inv.id}-doc-1`,
    name: `Invoice ${inv.id}.pdf`,
    type: 'Invoice',
    uploadedAt: inv.date,
    size: '156 KB',
  },
  ...(inv.status === 'Paid'
    ? [
        {
          id: `${inv.id}-doc-2`,
          name: 'Payment Receipt.pdf',
          type: 'Receipt',
          uploadedAt: inv.date,
          size: '92 KB',
        },
      ]
    : []),
];

export const buildInvoiceDetail = (base: Invoice): InvoiceDetail => {
  const override = DETAIL_OVERRIDES[base.id];
  const subtotal = override?.subtotal ?? base.amount;
  const tax = override?.tax ?? Math.round(subtotal * 0.05);
  const discount = override?.discount ?? 0;
  const total = subtotal + tax - discount;
  const paidAmount =
    override?.paidAmount ?? (base.status === 'Paid' ? total : base.status === 'Pending' ? 0 : 0);
  const balance = override?.balance ?? Math.max(0, total - paidAmount);

  return {
    ...base,
    dueDate: override?.dueDate ?? base.date,
    doctor: override?.doctor ?? 'Dr. Ananya Sharma',
    paymentMethod: override?.paymentMethod ?? (base.status === 'Paid' ? 'UPI / QR' : undefined),
    paidAmount,
    balance,
    tax,
    discount,
    subtotal,
    lineItems: override?.lineItems ?? defaultLineItems(base),
    paymentHistory: override?.paymentHistory ?? defaultPaymentHistory(base),
    activityLog: override?.activityLog ?? defaultActivity(base),
    documents: override?.documents ?? defaultDocuments(base),
    insuranceProvider: override?.insuranceProvider,
    insuranceClaimId: override?.insuranceClaimId,
    insuranceStatus: override?.insuranceStatus ?? 'Not Applicable',
  };
};

export const getInvoiceById = (invoiceId: string): Invoice | null =>
  MOCK_INVOICES.find((inv) => inv.id === invoiceId) ?? null;

export const getInvoiceDetail = (invoiceId: string): InvoiceDetail | null => {
  const base = getInvoiceById(invoiceId);
  return base ? buildInvoiceDetail(base) : null;
};
