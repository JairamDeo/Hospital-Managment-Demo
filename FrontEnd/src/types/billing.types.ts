export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue';

export type InvoiceFilter = 'all' | 'paid' | 'pending' | 'overdue';

export type FeeType = 'Consultation' | 'Medicine';

export type PaymentMethodType = 'Cash' | 'UPI' | 'Card' | 'Net Banking';

export interface Invoice {
  id: string;
  invoiceCode: string;
  patientName: string;
  patientId: string;
  patientCode: string;
  initials: string;
  avatarClass: string;
  date: string;
  treatment: string;
  feeType: FeeType;
  visitType?: string | null;
  appointmentCode?: string | null;
  doctorName?: string;
  amount: number;
  status: InvoiceStatus;
  paymentMethod?: string;
}

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

export type InvoiceDetailTab = 'items' | 'payments' | 'activity';

export interface InvoiceDetail extends Invoice {
  dueDate: string;
  doctor: string;
  paidAmount: number;
  balance: number;
  tax: number;
  discount: number;
  subtotal: number;
  lineItems: InvoiceLineItem[];
  paymentHistory: PaymentRecord[];
  activityLog: InvoiceActivity[];
}

export interface BillingStats {
  totalRevenue: number;
  collected: number;
  pending: number;
  overdue: number;
  pendingCount: number;
  overdueCount: number;
  invoiceCount: number;
  collectionRate: number;
  paymentMethods: PaymentMethodStat[];
}

export type PaymentMethodIcon = 'upi' | 'bank' | 'cash' | 'insurance';

export interface PaymentMethodStat {
  id: string;
  label: string;
  percent: number;
  icon: PaymentMethodIcon;
  iconClass: string;
}

export interface MedicineBillItem {
  itemCode: string;
  name: string;
  quantity: number;
  unitPrice: number;
  salePrice: number;
  stock: number;
}

export const formatRupee = (amount: number) =>
  `₹${Math.round(amount).toLocaleString('en-IN')}`;

export const formatRupeeCompact = (amount: number) => {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${Math.round(amount / 1000)}K`;
  return formatRupee(amount);
};
