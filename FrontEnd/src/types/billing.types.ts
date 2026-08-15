export type InvoiceStatus = 'Paid' | 'Pending' | 'Partial' | 'Overdue';

export type InvoiceFilter = 'all' | 'paid' | 'pending' | 'partial' | 'overdue';

export type FeeType = 'Consultation' | 'Medicine' | 'Panchakarma';

export type PaymentMethodType = 'Cash' | 'UPI' | 'Card' | 'Online' | 'Payment Link';

export const OFFLINE_PAYMENT_METHOD_OPTIONS = ['Cash', 'UPI', 'Card'] as const;
export type OfflinePaymentMethodType = (typeof OFFLINE_PAYMENT_METHOD_OPTIONS)[number];

export const PAYMENT_METHOD_OPTIONS: PaymentMethodType[] = [
  'Cash',
  'UPI',
  'Card',
  'Online',
  'Payment Link',
];

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
  programCode?: string | null;
  doctorName?: string;
  amount: number;
  amountPaid?: number;
  balance?: number;
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

export interface RazorpayPublicConfig {
  enabled: boolean;
  keyId: string;
}

export interface RazorpayOrderResponse {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  invoiceCode: string;
  patientName: string;
  description: string;
}

export interface RazorpayQrResponse {
  qrCodeId: string;
  qrImageUrl: string;
  amount: number;
  amountPaise: number;
  currency: string;
  invoiceCode: string;
  patientCode: string;
  patientName: string;
  feeType: FeeType;
  feeTypeLabel: string;
  doctorName: string;
  treatment: string;
  description: string;
  collectedBy: string;
  paymentRef: string;
}

export interface RazorpayPaymentLinkResponse {
  paymentLinkId: string;
  paymentLinkUrl: string;
  amount: number;
  amountPaise: number;
  currency: string;
  invoiceCode: string;
  patientCode: string;
  patientName: string;
  patientMobileMasked: string;
  feeType: FeeType;
  feeTypeLabel: string;
  doctorName: string;
  treatment: string;
  description: string;
  collectedBy: string;
  paymentRef: string;
  status: 'pending';
  smsSent: boolean;
  whatsappSent?: boolean;
  whatsappSkipped?: boolean;
  emailSent?: boolean;
  emailSkipped?: boolean;
}

export type RazorpayCollectionStatus = 'pending' | 'paid' | 'failed';

export interface PaymentCollectionSuccess {
  invoiceCode: string;
  patientCode: string;
  patientName: string;
  feeType: FeeType | string;
  feeTypeLabel: string;
  treatment: string;
  doctorName: string;
  description: string;
  amount: number;
  paymentMethod: string;
  collectedBy: string;
  status: string;
  paidAt?: string | Date | null;
}

export const feeTypeDisplayLabel = (feeType: FeeType | string) => {
  if (feeType === 'Medicine') return 'Medicine / Pharmacy';
  if (feeType === 'Panchakarma') return 'Panchakarma';
  return 'Consultation / Doctor fee';
};

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
