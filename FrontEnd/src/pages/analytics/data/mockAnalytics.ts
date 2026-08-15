export type TimeRange = '7D' | '30D' | '90D' | '1Y';

export interface KpiStat {
  label: string;
  value: string;
  subLabel: string;
  trend: number;
  trendUp: boolean;
}

export interface MonthlyOpdIpd {
  month: string;
  opd: number;
  ipd: number;
}

export interface DonutSegment {
  label: string;
  percent: number;
  color: string;
}

export interface TopDoctor {
  id: string;
  name: string;
  specialty: string;
  points: number;
  initials: string;
  avatarClass: string;
}

export interface TreatmentDemand {
  label: string;
  percent: number;
}

export const KPI_STATS: KpiStat[] = [
  {
    label: 'Total Revenue',
    value: '₹4.8L',
    subLabel: 'vs ₹4.3L last month',
    trend: 12,
    trendUp: true,
  },
  {
    label: 'Patient Growth',
    value: '1,452',
    subLabel: '+108 this month',
    trend: 8,
    trendUp: true,
  },
  {
    label: 'Avg. Visit Value',
    value: '₹3,200',
    subLabel: 'per consultation',
    trend: 5,
    trendUp: true,
  },
  {
    label: 'Bed Occupancy',
    value: '74%',
    subLabel: '18 of 24 beds',
    trend: 3,
    trendUp: false,
  },
];

export const OPD_IPD_MONTHLY: MonthlyOpdIpd[] = [
  { month: 'May', opd: 128, ipd: 86 },
  { month: 'Jun', opd: 142, ipd: 94 },
  { month: 'Jul', opd: 156, ipd: 102 },
  { month: 'Aug', opd: 168, ipd: 110 },
  { month: 'Sep', opd: 182, ipd: 118 },
  { month: 'Oct', opd: 198, ipd: 124 },
];

export const TREATMENT_DONUT: DonutSegment[] = [
  { label: 'Shodhana', percent: 38, color: '#1e5c47' },
  { label: 'Shamana', percent: 21, color: '#3d9170' },
  { label: 'Panchakarma', percent: 15, color: '#6aaf94' },
  { label: 'Rasayana', percent: 11, color: '#7c3aed' },
  { label: 'Others', percent: 15, color: '#d0e8dc' },
];

export const DONUT_CENTER = { value: 98, label: 'Active' };

export const TOP_DOCTORS: TopDoctor[] = [
  {
    id: '1',
    name: 'Dr. Ananya Sharma',
    specialty: 'Chief Physician · OPD',
    points: 284,
    initials: 'AS',
    avatarClass: 'bg-violet-100 text-violet-700',
  },
  {
    id: '2',
    name: 'Dr. Rekha Nair',
    specialty: 'Vamana Specialist',
    points: 196,
    initials: 'RN',
    avatarClass: 'bg-pink-100 text-pink-700',
  },
  {
    id: '3',
    name: 'Dr. Kiran Patel',
    specialty: 'General Physician',
    points: 162,
    initials: 'KP',
    avatarClass: 'bg-blue-100 text-blue-700',
  },
  {
    id: '4',
    name: 'Dr. Sunita Mehta',
    specialty: 'Panchakarma Physician',
    points: 148,
    initials: 'SM',
    avatarClass: 'bg-emerald-100 text-emerald-800',
  },
];

export const TREATMENT_DEMAND: TreatmentDemand[] = [
  { label: 'General Consultation', percent: 88 },
  { label: 'Panchakarma Program', percent: 64 },
  { label: 'Diet & Lifestyle Plan', percent: 52 },
  { label: 'Shodhana Therapy', percent: 41 },
  { label: 'Rasayana Therapy', percent: 30 },
];
