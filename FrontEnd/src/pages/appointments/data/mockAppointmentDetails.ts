import type { Patient } from '@/types/patient.types';
import { MOCK_STAFF } from '@/pages/staff/data/mockStaff';
import {
  MOCK_APPOINTMENTS,
  type Appointment,
  type AppointmentStatus,
  type AppointmentType,
} from './mockAppointments';

export interface AppointmentVitals {
  bp: string;
  pulse: string;
  temp: string;
  spo2: string;
  weight?: string;
}

export interface AppointmentActivity {
  id: string;
  title: string;
  date: string;
  description: string;
  actor: string;
}

export interface AppointmentDocument {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  size: string;
}

export interface AppointmentClinicalNote {
  label: string;
  value: string;
}

export type AppointmentDetailTab = 'overview' | 'vitals' | 'notes' | 'activity' | 'documents';

export interface AppointmentDetail extends Appointment {
  formattedDate: string;
  formattedTime: string;
  duration: string;
  doctor: string;
  doctorId: string;
  room: string;
  department: string;
  chiefComplaint: string;
  symptoms: string[];
  diagnosis?: string;
  treatmentPlan?: string;
  patientPhone: string;
  patientAge: string;
  patientPrakriti?: string;
  checkInTime?: string;
  fee: number;
  paymentStatus: 'Paid' | 'Pending' | 'Waived';
  vitals?: AppointmentVitals;
  clinicalNotes: AppointmentClinicalNote[];
  doctorNotes?: string;
  followUp?: string;
  prepInstructions?: string[];
  activityLog: AppointmentActivity[];
  documents: AppointmentDocument[];
}

const DOCTORS = MOCK_STAFF.filter((s) => s.role === 'Doctor');
const THERAPISTS = MOCK_STAFF.filter((s) => s.role === 'Therapist');

const formatDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatTime = (time: string) => {
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
};

const durationForType = (type: AppointmentType): string => {
  switch (type) {
    case 'Panchakarma':
    case 'Shodhana':
      return '90 min';
    case 'Diet Consult':
      return '45 min';
    case 'Follow-up':
      return '20 min';
    default:
      return '30 min';
  }
};

const departmentForType = (type: AppointmentType): string => {
  switch (type) {
    case 'Panchakarma':
    case 'Shodhana':
      return 'Panchakarma Wing';
    case 'Diet Consult':
      return 'Nutrition & Dietetics';
    default:
      return 'OPD — Ayurveda';
  }
};

const roomForType = (type: AppointmentType, index: number): string => {
  if (type === 'Panchakarma' || type === 'Shodhana') {
    return `Therapy Room ${(index % 3) + 1}`;
  }
  return `Consultation ${String.fromCharCode(65 + (index % 4))}`;
};

const assignStaff = (type: AppointmentType, index: number) => {
  if (type === 'Panchakarma' || type === 'Shodhana') {
    const therapist = THERAPISTS[index % THERAPISTS.length];
    return { name: therapist.name, id: therapist.id };
  }
  const doctor = DOCTORS[index % DOCTORS.length];
  return { name: doctor.name, id: doctor.id };
};

const feeForType = (type: AppointmentType): number => {
  switch (type) {
    case 'Panchakarma':
      return 2500;
    case 'Shodhana':
      return 3200;
    case 'Diet Consult':
      return 800;
    case 'Follow-up':
      return 500;
    default:
      return 750;
  }
};

const DETAIL_OVERRIDES: Record<string, Partial<Omit<AppointmentDetail, keyof Appointment>>> = {
  'APT-001': {
    chiefComplaint: 'Recurring joint stiffness and fatigue',
    symptoms: ['Joint pain', 'Morning stiffness', 'Low energy', 'Irregular sleep'],
    diagnosis: 'Vata aggravation with Ama accumulation',
    treatmentPlan: 'Abhyanga + Swedana for 7 days, Ashwagandha churna BID, follow-up in 2 weeks',
    checkInTime: undefined,
    doctorNotes:
      'Patient reports symptoms worsening during monsoon. Prakriti assessment confirms Vata dominance. Recommended gentle Panchakarma prep before Shodhana.',
    followUp: 'Nov 9, 2023 · Follow-up consult',
    prepInstructions: [
      'Light diet — avoid cold & raw foods 24 hrs before',
      'Arrive 15 minutes early for registration',
      'Bring previous lab reports if available',
    ],
    vitals: undefined,
    clinicalNotes: [
      { label: 'Prakriti', value: 'Vata-Pitta' },
      { label: 'Agni', value: 'Manda (weak digestion)' },
      { label: 'Nadi', value: 'Vata dominant — 78 bpm' },
      { label: 'Tongue', value: 'Coated, pale' },
    ],
    activityLog: [
      {
        id: 'act-1',
        title: 'Appointment Scheduled',
        date: 'Oct 24, 2023 · 4:30 PM',
        description: 'General consultation booked via front desk for Oct 26 at 10:30 AM.',
        actor: 'Reception — Kavita Nair',
      },
      {
        id: 'act-2',
        title: 'Reminder Sent',
        date: 'Oct 25, 2023 · 9:00 AM',
        description: 'SMS reminder sent to patient mobile ending 3210.',
        actor: 'System',
      },
    ],
    documents: [
      {
        id: 'doc-1',
        name: 'Appointment Slip APT-001.pdf',
        type: 'Slip',
        uploadedAt: 'Oct 24, 2023',
        size: '64 KB',
      },
    ],
    paymentStatus: 'Pending',
  },
  'APT-002': {
    chiefComplaint: 'Day 3 — Vamana therapy session',
    symptoms: ['Mild nausea (expected)', 'Fatigue post-procedure'],
    diagnosis: 'Panchakarma — Vamana protocol (Day 3/7)',
    treatmentPlan: 'Continue Vamana series; monitor hydration and rest',
    checkInTime: '10:52 AM',
    doctorNotes:
      'Patient tolerated yesterday\'s session well. Pre-procedure vitals stable. Proceed with today\'s Vamana under Dr. Ananya Sharma supervision.',
    followUp: 'Daily sessions through Oct 30, 2023',
    prepInstructions: ['Fasting from 6 AM', 'No heavy meals previous night', 'Wear comfortable cotton clothing'],
    vitals: {
      bp: '118/76 mmHg',
      pulse: '72 bpm',
      temp: '98.2 °F',
      spo2: '98%',
      weight: '58 kg',
    },
    clinicalNotes: [
      { label: 'Prakriti', value: 'Pitta-Kapha' },
      { label: 'Session', value: 'Vamana — Day 3 of 7' },
      { label: 'Agni', value: 'Tikshna (sharp)' },
      { label: 'Response', value: 'Good tolerance on Day 2' },
    ],
    activityLog: [
      {
        id: 'act-1',
        title: 'Checked In',
        date: 'Oct 26, 2023 · 10:52 AM',
        description: 'Patient arrived and vitals recorded at Panchakarma reception.',
        actor: 'Therapist — Meera Iyer',
      },
      {
        id: 'act-2',
        title: 'Session Started',
        date: 'Oct 26, 2023 · 11:05 AM',
        description: 'Vamana therapy commenced in Therapy Room 2.',
        actor: 'Dr. Ananya Sharma',
      },
    ],
    documents: [
      {
        id: 'doc-1',
        name: 'Panchakarma Consent Form.pdf',
        type: 'Consent',
        uploadedAt: 'Oct 20, 2023',
        size: '128 KB',
      },
      {
        id: 'doc-2',
        name: 'Day 2 Session Notes.pdf',
        type: 'Clinical',
        uploadedAt: 'Oct 25, 2023',
        size: '94 KB',
      },
    ],
    paymentStatus: 'Paid',
  },
};

const defaultSymptoms = (type: AppointmentType): string[] => {
  switch (type) {
    case 'Follow-up':
      return ['Progress review', 'Medication adherence check'];
    case 'Diet Consult':
      return ['Weight management', 'Digestive issues'];
    case 'Panchakarma':
      return ['Detox protocol', 'Stress & fatigue'];
    default:
      return ['General wellness consult'];
  }
};

const defaultActivity = (appt: Appointment, doctor: string): AppointmentActivity[] => {
  const entries: AppointmentActivity[] = [
    {
      id: `${appt.id}-act-1`,
      title: 'Appointment Created',
      date: `${formatDate(appt.date)} · ${formatTime(appt.time)}`,
      description: `${appt.type} scheduled for ${appt.patientName}. Assigned to ${doctor}.`,
      actor: 'Reception',
    },
  ];

  if (appt.status === 'In') {
    entries.unshift({
      id: `${appt.id}-act-checkin`,
      title: 'Checked In',
      date: `${formatDate(appt.date)} · ${formatTime(appt.time)}`,
      description: 'Patient checked in and waiting for consultation.',
      actor: 'Front Desk',
    });
  }

  if (appt.status === 'Done') {
    entries.unshift({
      id: `${appt.id}-act-done`,
      title: 'Consultation Completed',
      date: formatDate(appt.date),
      description: `${appt.type} completed successfully. Follow-up scheduled if required.`,
      actor: doctor,
    });
  }

  return entries;
};

const defaultDocuments = (appt: Appointment): AppointmentDocument[] => [
  {
    id: `${appt.id}-doc-1`,
    name: `Appointment ${appt.id}.pdf`,
    type: 'Slip',
    uploadedAt: formatDate(appt.date),
    size: '58 KB',
  },
];

const paymentForStatus = (status: AppointmentStatus): AppointmentDetail['paymentStatus'] => {
  if (status === 'Done') return 'Paid';
  if (status === 'Cancelled') return 'Waived';
  return 'Pending';
};

export const buildAppointmentDetail = (
  base: Appointment,
  patientList: Patient[] = []
): AppointmentDetail => {
  const index = MOCK_APPOINTMENTS.findIndex((a) => a.id === base.id);
  const patient = patientList.find((p) => p.id === base.patientId);
  const staff = assignStaff(base.type, index >= 0 ? index : 0);
  const override = DETAIL_OVERRIDES[base.id];

  return {
    ...base,
    formattedDate: formatDate(base.date),
    formattedTime: formatTime(base.time),
    duration: durationForType(base.type),
    doctor: staff.name,
    doctorId: staff.id,
    room: roomForType(base.type, index >= 0 ? index : 0),
    department: departmentForType(base.type),
    chiefComplaint: override?.chiefComplaint ?? `${base.type} — ${patient?.treatment ?? 'wellness visit'}`,
    symptoms: override?.symptoms ?? defaultSymptoms(base.type),
    diagnosis: override?.diagnosis,
    treatmentPlan: override?.treatmentPlan,
    patientPhone: patient?.mobile ?? '—',
    patientAge: patient ? `${patient.age} yrs` : '—',
    patientPrakriti: patient?.prakriti,
    checkInTime: override?.checkInTime ?? (base.status === 'In' ? formatTime(base.time) : undefined),
    fee: feeForType(base.type),
    paymentStatus: override?.paymentStatus ?? paymentForStatus(base.status),
    vitals: override?.vitals ?? (base.status === 'In' || base.status === 'Done'
      ? { bp: '120/80 mmHg', pulse: '76 bpm', temp: '98.4 °F', spo2: '97%' }
      : undefined),
    clinicalNotes: override?.clinicalNotes ?? [
      { label: 'Prakriti', value: patient?.prakriti ?? '—' },
      { label: 'Last Visit', value: patient?.lastVisit ?? '—' },
      { label: 'Active Treatment', value: patient?.treatment ?? '—' },
    ],
    doctorNotes: override?.doctorNotes,
    followUp: override?.followUp,
    prepInstructions: override?.prepInstructions ?? [
      'Arrive 10 minutes before scheduled time',
      'Carry previous prescriptions if any',
    ],
    activityLog: override?.activityLog ?? defaultActivity(base, staff.name),
    documents: override?.documents ?? defaultDocuments(base),
  };
};

export const getAppointmentById = (appointmentId: string): Appointment | null =>
  MOCK_APPOINTMENTS.find((a) => a.id === appointmentId) ?? null;

export const getAppointmentDetail = (appointmentId: string): AppointmentDetail | null => {
  const base = getAppointmentById(appointmentId);
  return base ? buildAppointmentDetail(base) : null;
};
