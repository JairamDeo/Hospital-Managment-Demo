import { MOCK_PATIENTS, type Patient } from './mockPatients';

export interface PatientVitals {
  temp: string;
  bp: string;
  pulse: string;
  bmi: string;
}

export interface ActiveTreatment {
  program: string;
  stage: string;
  dayCurrent: number;
  dayTotal: number;
  percentComplete: number;
}

export type TreatmentRecordStatus = 'Active' | 'Completed';

export interface TreatmentRecord {
  id: string;
  title: string;
  doctor: string;
  status: TreatmentRecordStatus;
  dateRange: string;
  description: string;
  medicines: string[];
}

export interface PatientAppointment {
  id: string;
  date: string;
  time: string;
  type: string;
  doctor: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
}

export interface Prescription {
  id: string;
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  prescribedBy: string;
  date: string;
  status: 'Active' | 'Completed';
}

export interface LabReport {
  id: string;
  testName: string;
  date: string;
  result: string;
  status: 'Normal' | 'Abnormal' | 'Pending';
  lab: string;
}

export interface PatientInvoice {
  id: string;
  date: string;
  treatment: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export interface PatientDocument {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  size: string;
}

export type PatientDetailTab =
  | 'history'
  | 'appointments'
  | 'prescriptions'
  | 'labs'
  | 'billing'
  | 'documents';

export interface PatientDetail extends Patient {
  gender: string;
  bloodGroup: string;
  memberSince: string;
  city: string;
  vitals: PatientVitals;
  activeTreatment?: ActiveTreatment;
  treatmentHistory: TreatmentRecord[];
  appointments: PatientAppointment[];
  prescriptions: Prescription[];
  labReports: LabReport[];
  invoices: PatientInvoice[];
  documents: PatientDocument[];
}

const DETAIL_OVERRIDES: Record<string, Partial<Omit<PatientDetail, keyof Patient>>> = {
  'AH-10018': {
    gender: 'Female',
    bloodGroup: 'B+',
    memberSince: 'Mar 2022',
    city: 'Pune, MH',
    vitals: { temp: '98.4 °F', bp: '118/78', pulse: '72 bpm', bmi: '22' },
    activeTreatment: {
      program: 'Panchakarma Program',
      stage: 'Vamana — Day 3 of 7',
      dayCurrent: 3,
      dayTotal: 7,
      percentComplete: 43,
    },
    treatmentHistory: [
      {
        id: 'th-1',
        title: 'Panchakarma — Vamana Therapy',
        doctor: 'Dr. Ananya Sharma',
        status: 'Active',
        dateRange: 'Oct 24 — Nov 1, 2023',
        description:
          'Patient presenting with Pitta aggravation — acidity, skin rashes, and irritability. Vamana protocol initiated with pre-procedure Snehana and Swedana completed. Day 3 of emesis therapy in progress. Vitals stable.',
        medicines: ['Madanaphala Pippali', 'Vacha Churna', 'Licorice Decoction'],
      },
      {
        id: 'th-2',
        title: 'Shamana Chikitsa — Pitta Pacification',
        doctor: 'Dr. Ananya Sharma',
        status: 'Completed',
        dateRange: 'Aug 10 — Sep 10, 2023',
        description:
          '30-day Shamana program for Pitta balancing. Dietary modifications and cooling herbs prescribed. Patient reported significant improvement in digestion and sleep quality.',
        medicines: ['Amalaki Rasayana', 'Shatavari', 'Guduchi'],
      },
      {
        id: 'th-3',
        title: 'General Consultation & Prakriti Analysis',
        doctor: 'Dr. Ananya Sharma',
        status: 'Completed',
        dateRange: 'Mar 15, 2022',
        description:
          'Initial assessment and Prakriti determination. Pitta-dominant constitution confirmed. Baseline vitals recorded. Lifestyle and dietary recommendations provided.',
        medicines: ['Triphala', 'Brahmi Ghrita'],
      },
    ],
    appointments: [
      { id: 'pa-1', date: 'Oct 28, 2023', time: '10:30 AM', type: 'Panchakarma Session', doctor: 'Dr. Ananya Sharma', status: 'Upcoming' },
      { id: 'pa-2', date: 'Oct 25, 2023', time: '11:00 AM', type: 'Follow-up Consult', doctor: 'Dr. Ananya Sharma', status: 'Completed' },
      { id: 'pa-3', date: 'Oct 18, 2023', time: '09:30 AM', type: 'Vamana Prep', doctor: 'Dr. Rekha Nair', status: 'Completed' },
    ],
    prescriptions: [
      { id: 'rx-1', medicine: 'Madanaphala Pippali', dosage: '500 mg', frequency: 'Once daily', duration: '7 days', prescribedBy: 'Dr. Ananya Sharma', date: 'Oct 24, 2023', status: 'Active' },
      { id: 'rx-2', medicine: 'Vacha Churna', dosage: '3 g', frequency: 'Twice daily', duration: '14 days', prescribedBy: 'Dr. Ananya Sharma', date: 'Oct 24, 2023', status: 'Active' },
      { id: 'rx-3', medicine: 'Triphala', dosage: '1 tsp', frequency: 'At bedtime', duration: '30 days', prescribedBy: 'Dr. Ananya Sharma', date: 'Aug 10, 2023', status: 'Completed' },
    ],
    labReports: [
      { id: 'lr-1', testName: 'Complete Blood Count', date: 'Oct 20, 2023', result: 'All parameters normal', status: 'Normal', lab: 'Ayurveda Diagnostics' },
      { id: 'lr-2', testName: 'Liver Function Test', date: 'Oct 20, 2023', result: 'Within range', status: 'Normal', lab: 'Ayurveda Diagnostics' },
      { id: 'lr-3', testName: 'Thyroid Profile', date: 'Mar 15, 2022', result: 'TSH slightly elevated', status: 'Abnormal', lab: 'City Lab Pune' },
    ],
    invoices: [
      { id: 'INV-1024', date: 'Oct 24, 2023', treatment: 'Panchakarma — Vamana', amount: 18500, status: 'Paid' },
      { id: 'INV-1018', date: 'Aug 10, 2023', treatment: 'Shamana Chikitsa', amount: 6200, status: 'Paid' },
      { id: 'INV-1002', date: 'Mar 15, 2022', treatment: 'Initial Consultation', amount: 1500, status: 'Paid' },
    ],
    documents: [
      { id: 'doc-1', name: 'Prakriti Analysis Report.pdf', type: 'Clinical Report', uploadedAt: 'Mar 15, 2022', size: '245 KB' },
      { id: 'doc-2', name: 'Consent Form — Panchakarma.pdf', type: 'Consent', uploadedAt: 'Oct 22, 2023', size: '128 KB' },
      { id: 'doc-3', name: 'Lab Results Oct 2023.pdf', type: 'Lab Report', uploadedAt: 'Oct 21, 2023', size: '312 KB' },
    ],
  },
};

const defaultVitals = (): PatientVitals => ({
  temp: '98.2 °F',
  bp: '120/80',
  pulse: '74 bpm',
  bmi: '23',
});

const defaultHistory = (patient: Patient): TreatmentRecord[] => [
  {
    id: `${patient.id}-th-1`,
    title: patient.treatment,
    doctor: 'Dr. Ananya Sharma',
    status: patient.status === 'Active' ? 'Active' : 'Completed',
    dateRange: patient.lastVisit,
    description: `Ongoing care for ${patient.name}. Last documented visit on ${patient.lastVisit}. Treatment plan aligned with ${patient.prakriti} Prakriti constitution.`,
    medicines: ['Triphala', 'Ashwagandha'],
  },
  {
    id: `${patient.id}-th-2`,
    title: 'General Consultation & Prakriti Analysis',
    doctor: 'Dr. Ananya Sharma',
    status: 'Completed',
    dateRange: 'Initial visit',
    description: `${patient.prakriti}-dominant Prakriti assessment completed. Baseline health profile established.`,
    medicines: ['Triphala'],
  },
];

const defaultAppointments = (patient: Patient): PatientAppointment[] => [
  {
    id: `${patient.id}-ap-1`,
    date: patient.lastVisit,
    time: '10:30 AM',
    type: patient.treatment,
    doctor: 'Dr. Ananya Sharma',
    status: patient.status === 'Active' ? 'Upcoming' : 'Completed',
  },
  {
    id: `${patient.id}-ap-2`,
    date: 'Oct 10, 2023',
    time: '11:00 AM',
    type: 'Follow-up Consult',
    doctor: 'Dr. Rekha Nair',
    status: 'Completed',
  },
];

const defaultPrescriptions = (patient: Patient): Prescription[] => [
  {
    id: `${patient.id}-rx-1`,
    medicine: 'Triphala',
    dosage: '1 tsp',
    frequency: 'At bedtime',
    duration: '30 days',
    prescribedBy: 'Dr. Ananya Sharma',
    date: patient.lastVisit,
    status: 'Active',
  },
  {
    id: `${patient.id}-rx-2`,
    medicine: 'Ashwagandha',
    dosage: '500 mg',
    frequency: 'Twice daily',
    duration: '60 days',
    prescribedBy: 'Dr. Ananya Sharma',
    date: patient.lastVisit,
    status: 'Active',
  },
];

const defaultLabReports = (patient: Patient): LabReport[] => [
  {
    id: `${patient.id}-lr-1`,
    testName: 'Complete Blood Count',
    date: patient.lastVisit,
    result: 'All parameters normal',
    status: 'Normal',
    lab: 'Ayurveda Diagnostics',
  },
  {
    id: `${patient.id}-lr-2`,
    testName: 'Blood Sugar (Fasting)',
    date: patient.lastVisit,
    result: '92 mg/dL',
    status: 'Normal',
    lab: 'Ayurveda Diagnostics',
  },
];

const defaultInvoices = (patient: Patient): PatientInvoice[] => [
  {
    id: `INV-${patient.id.slice(-4)}`,
    date: patient.lastVisit,
    treatment: patient.treatment,
    amount: patient.treatment.includes('Panchakarma') ? 14200 : 3200,
    status: patient.status === 'Pending' ? 'Pending' : 'Paid',
  },
  {
    id: `INV-${patient.id.slice(-3)}1`,
    date: 'Sep 15, 2023',
    treatment: 'General Consultation',
    amount: 1500,
    status: 'Paid',
  },
];

const defaultDocuments = (patient: Patient): PatientDocument[] => [
  {
    id: `${patient.id}-doc-1`,
    name: 'Registration Form.pdf',
    type: 'Registration',
    uploadedAt: patient.lastVisit,
    size: '156 KB',
  },
  {
    id: `${patient.id}-doc-2`,
    name: 'Consent Form.pdf',
    type: 'Consent',
    uploadedAt: patient.lastVisit,
    size: '98 KB',
  },
];

export const buildPatientDetail = (base: Patient): PatientDetail => {
  const override = DETAIL_OVERRIDES[base.id];
  const activeTreatment =
    override?.activeTreatment ??
    (base.status === 'Active' && base.treatment.toLowerCase().includes('panchakarma')
      ? {
          program: 'Panchakarma Program',
          stage: `${base.treatment} — In progress`,
          dayCurrent: 2,
          dayTotal: 7,
          percentComplete: 28,
        }
      : undefined);

  return {
    ...base,
    gender: override?.gender ?? 'Not recorded',
    bloodGroup: override?.bloodGroup ?? '—',
    memberSince: override?.memberSince ?? 'Jan 2023',
    city: override?.city ?? 'India',
    vitals: override?.vitals ?? defaultVitals(),
    activeTreatment,
    treatmentHistory: override?.treatmentHistory ?? defaultHistory(base),
    appointments: override?.appointments ?? defaultAppointments(base),
    prescriptions: override?.prescriptions ?? defaultPrescriptions(base),
    labReports: override?.labReports ?? defaultLabReports(base),
    invoices: override?.invoices ?? defaultInvoices(base),
    documents: override?.documents ?? defaultDocuments(base),
  };
};

export const getPatientDetail = (patientId: string): PatientDetail | null => {
  const base = MOCK_PATIENTS.find((p) => p.id === patientId);
  if (!base) return null;
  return buildPatientDetail(base);
};

export const getPatientById = (patientId: string): Patient | null =>
  MOCK_PATIENTS.find((p) => p.id === patientId) ?? null;

export const formatPatientRupee = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
