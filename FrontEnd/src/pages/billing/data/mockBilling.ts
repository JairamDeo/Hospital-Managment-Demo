export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue';

export type InvoiceFilter = 'all' | 'paid' | 'pending' | 'overdue';

export interface Invoice {
  id: string;
  patientName: string;
  patientId: string;
  initials: string;
  avatarClass: string;
  date: string;
  treatment: string;
  amount: number;
  status: InvoiceStatus;
}

export type PaymentMethodIcon = 'upi' | 'bank' | 'cash' | 'insurance';

export interface PaymentMethod {
  id: string;
  label: string;
  percent: number;
  icon: PaymentMethodIcon;
  iconClass: string;
}

export interface InsuranceClaim {
  id: string;
  provider: string;
  claims: number;
  amount: number;
}

export interface InvoiceFormValues {
  patientName: string;
  treatment: string;
  amount: number;
  status: InvoiceStatus;
}

export const BILLING_STATS = {
  totalRevenue: '₹4.8L',
  revenueTrend: 12,
  collected: '₹3.9L',
  collectionRate: 82,
  pending: '₹64K',
  pendingCount: 18,
  overdue: '₹12K',
  overdueCount: 4,
  invoiceCount: 284,
};

export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'INV-1024',
    patientName: 'Priya Sharma',
    patientId: 'AH-10018',
    initials: 'PS',
    avatarClass: 'bg-pink-100 text-pink-700',
    date: 'Oct 26, 2023',
    treatment: 'Panchakarma',
    amount: 12500,
    status: 'Paid',
  },
  {
    id: 'INV-1023',
    patientName: 'Rahul Singh',
    patientId: 'AH-10024',
    initials: 'RS',
    avatarClass: 'bg-blue-100 text-blue-700',
    date: 'Oct 26, 2023',
    treatment: 'General Consult',
    amount: 3200,
    status: 'Paid',
  },
  {
    id: 'INV-1022',
    patientName: 'Vijay Kumar',
    patientId: 'AH-10031',
    initials: 'VK',
    avatarClass: 'bg-emerald-100 text-emerald-800',
    date: 'Oct 25, 2023',
    treatment: 'Shodhana Therapy',
    amount: 18500,
    status: 'Pending',
  },
  {
    id: 'INV-1021',
    patientName: 'Meera Kapoor',
    patientId: 'AH-10062',
    initials: 'MK',
    avatarClass: 'bg-violet-100 text-violet-700',
    date: 'Oct 25, 2023',
    treatment: 'Nasya Program',
    amount: 8400,
    status: 'Pending',
  },
  {
    id: 'INV-1020',
    patientName: 'Ananya Desai',
    patientId: 'AH-10009',
    initials: 'AD',
    avatarClass: 'bg-violet-100 text-violet-700',
    date: 'Oct 24, 2023',
    treatment: 'Diet Consult',
    amount: 2800,
    status: 'Paid',
  },
  {
    id: 'INV-1019',
    patientName: 'Arjun Patel',
    patientId: 'AH-10072',
    initials: 'AP',
    avatarClass: 'bg-teal-100 text-teal-800',
    date: 'Oct 24, 2023',
    treatment: 'Follow-up',
    amount: 1500,
    status: 'Overdue',
  },
  {
    id: 'INV-1018',
    patientName: 'Anita Roy',
    patientId: 'AH-10071',
    initials: 'AR',
    avatarClass: 'bg-amber-100 text-amber-800',
    date: 'Oct 23, 2023',
    treatment: 'Virechana',
    amount: 9800,
    status: 'Paid',
  },
  {
    id: 'INV-1017',
    patientName: 'Sunita Rao',
    patientId: 'AH-10045',
    initials: 'SR',
    avatarClass: 'bg-pink-100 text-pink-700',
    date: 'Oct 23, 2023',
    treatment: 'Panchakarma',
    amount: 14200,
    status: 'Pending',
  },
  {
    id: 'INV-1016',
    patientName: 'Karan Desai',
    patientId: 'AH-10088',
    initials: 'KD',
    avatarClass: 'bg-blue-100 text-blue-700',
    date: 'Oct 22, 2023',
    treatment: 'General Consult',
    amount: 3200,
    status: 'Paid',
  },
  {
    id: 'INV-1015',
    patientName: 'Neha Gupta',
    patientId: 'AH-10091',
    initials: 'NG',
    avatarClass: 'bg-emerald-100 text-emerald-800',
    date: 'Oct 22, 2023',
    treatment: 'Lab Review',
    amount: 4500,
    status: 'Overdue',
  },
  {
    id: 'INV-1014',
    patientName: 'Rohit Malhotra',
    patientId: 'AH-10095',
    initials: 'RM',
    avatarClass: 'bg-amber-100 text-amber-800',
    date: 'Oct 21, 2023',
    treatment: 'Basti Therapy',
    amount: 11200,
    status: 'Paid',
  },
  {
    id: 'INV-1013',
    patientName: 'Pooja Nair',
    patientId: 'AH-10097',
    initials: 'PN',
    avatarClass: 'bg-violet-100 text-violet-700',
    date: 'Oct 21, 2023',
    treatment: 'Rasayana',
    amount: 7600,
    status: 'Pending',
  },
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'pm-1', label: 'UPI / QR', percent: 65, icon: 'upi', iconClass: 'bg-violet-100 text-violet-700' },
  { id: 'pm-2', label: 'Net Banking', percent: 20, icon: 'bank', iconClass: 'bg-blue-100 text-blue-700' },
  { id: 'pm-3', label: 'Cash', percent: 10, icon: 'cash', iconClass: 'bg-emerald-100 text-emerald-700' },
  { id: 'pm-4', label: 'Insurance', percent: 5, icon: 'insurance', iconClass: 'bg-amber-100 text-amber-700' },
];

export const INSURANCE_CLAIMS: InsuranceClaim[] = [
  { id: 'ic-1', provider: 'Star Health', claims: 12, amount: 84000 },
  { id: 'ic-2', provider: 'HDFC Ergo', claims: 8, amount: 52000 },
  { id: 'ic-3', provider: 'ICICI Lombard', claims: 5, amount: 38000 },
  { id: 'ic-4', provider: 'Care Health', claims: 3, amount: 22000 },
];

export const emptyInvoiceForm = (): InvoiceFormValues => ({
  patientName: '',
  treatment: 'General Consult',
  amount: 3200,
  status: 'Pending',
});

export const formatRupee = (amount: number) =>
  `₹${amount.toLocaleString('en-IN')}`;
