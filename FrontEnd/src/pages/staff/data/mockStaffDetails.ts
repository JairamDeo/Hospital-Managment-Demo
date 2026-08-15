import { MOCK_STAFF, type StaffMember } from './mockStaff';

export interface StaffMetrics {
  patientsToday: number;
  totalHandled: number;
  totalLabel: string;
  rating: number;
  shiftHours: string;
}

export interface StaffScheduleSlot {
  id: string;
  time: string;
  title: string;
  patientOrTask: string;
  status: 'Upcoming' | 'In Progress' | 'Completed';
}

export type ActivityStatus = 'Active' | 'Completed';

export interface StaffActivity {
  id: string;
  title: string;
  dateRange: string;
  status: ActivityStatus;
  description: string;
  tags: string[];
}

export interface StaffAssignment {
  id: string;
  patientName: string;
  patientId: string;
  program: string;
  since: string;
  status: 'Active' | 'Completed';
}

export interface StaffPerformanceRecord {
  id: string;
  month: string;
  patientsSeen: number;
  rating: number;
  notes: string;
}

export interface StaffDocument {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  size: string;
}

export interface LeaveRecord {
  id: string;
  type: string;
  from: string;
  to: string;
  days: number;
  status: 'Approved' | 'Pending' | 'Rejected';
}

export type StaffDetailTab =
  | 'activity'
  | 'schedule'
  | 'assignments'
  | 'performance'
  | 'documents'
  | 'leave';

export interface StaffDetail extends StaffMember {
  email: string;
  phone: string;
  department: string;
  joinedDate: string;
  experience: string;
  metrics: StaffMetrics;
  todaySchedule: StaffScheduleSlot[];
  activityLog: StaffActivity[];
  weeklySchedule: StaffScheduleSlot[];
  assignments: StaffAssignment[];
  performanceRecords: StaffPerformanceRecord[];
  documents: StaffDocument[];
  leaveRecords: LeaveRecord[];
}

const DETAIL_OVERRIDES: Record<string, Partial<Omit<StaffDetail, keyof StaffMember>>> = {
  'STF-001': {
    email: 'ananya.sharma@ayurvedahealth.com',
    phone: '+91 98200 11234',
    department: 'OPD & Panchakarma',
    joinedDate: 'Jan 2019',
    experience: '5 yrs',
    metrics: {
      patientsToday: 12,
      totalHandled: 284,
      totalLabel: 'Total Patients',
      rating: 4.9,
      shiftHours: '8 hrs',
    },
    todaySchedule: [
      { id: 'ts-1', time: '10:30 AM', title: 'OPD Consult', patientOrTask: 'Rahul Singh', status: 'Completed' },
      { id: 'ts-2', time: '11:00 AM', title: 'Panchakarma Review', patientOrTask: 'Priya Sharma', status: 'In Progress' },
      { id: 'ts-3', time: '12:30 PM', title: 'Follow-up', patientOrTask: 'Amit Verma', status: 'Upcoming' },
      { id: 'ts-4', time: '2:00 PM', title: 'Prakriti Analysis', patientOrTask: 'Neha Gupta', status: 'Upcoming' },
    ],
    activityLog: [
      {
        id: 'act-1',
        title: 'Panchakarma — Vamana Supervision',
        dateRange: 'Oct 24 — Nov 1, 2023',
        status: 'Active',
        description:
          'Supervising Priya Sharma through Vamana protocol. Day 3 emesis therapy in progress. Pre-procedure Snehana and Swedana completed successfully.',
        tags: ['Vamana', 'Panchakarma', 'Pitta'],
      },
      {
        id: 'act-2',
        title: 'OPD Consultations — Week 43',
        dateRange: 'Oct 16 — Oct 22, 2023',
        status: 'Completed',
        description: 'Completed 48 OPD consultations including follow-ups, new patient assessments, and Prakriti analyses.',
        tags: ['OPD', 'Consultation'],
      },
      {
        id: 'act-3',
        title: 'Staff Training — Panchakarma Protocols',
        dateRange: 'Sep 5, 2023',
        status: 'Completed',
        description: 'Conducted internal training session for junior therapists on updated Vamana and Virechana protocols.',
        tags: ['Training', 'Internal'],
      },
    ],
    weeklySchedule: [
      { id: 'ws-1', time: 'Mon 9AM', title: 'OPD', patientOrTask: 'General consultations', status: 'Completed' },
      { id: 'ws-2', time: 'Tue 9AM', title: 'Panchakarma', patientOrTask: 'Vamana ward rounds', status: 'Completed' },
      { id: 'ws-3', time: 'Wed 9AM', title: 'OPD', patientOrTask: 'Follow-ups', status: 'Completed' },
      { id: 'ws-4', time: 'Thu 9AM', title: 'Panchakarma', patientOrTask: 'Therapy supervision', status: 'In Progress' },
      { id: 'ws-5', time: 'Fri 9AM', title: 'OPD', patientOrTask: 'New registrations', status: 'Upcoming' },
    ],
    assignments: [
      { id: 'as-1', patientName: 'Priya Sharma', patientId: 'AH-10018', program: 'Panchakarma — Vamana', since: 'Oct 24, 2023', status: 'Active' },
      { id: 'as-2', patientName: 'Rahul Singh', patientId: 'AH-10024', program: 'General Consult', since: 'Oct 26, 2023', status: 'Active' },
      { id: 'as-3', patientName: 'Meera Joshi', patientId: 'AH-10055', program: 'Shamana Chikitsa', since: 'Sep 10, 2023', status: 'Completed' },
    ],
    performanceRecords: [
      { id: 'pr-1', month: 'Oct 2023', patientsSeen: 186, rating: 4.9, notes: 'Highest patient satisfaction in OPD' },
      { id: 'pr-2', month: 'Sep 2023', patientsSeen: 172, rating: 4.8, notes: 'Strong Panchakarma outcomes' },
      { id: 'pr-3', month: 'Aug 2023', patientsSeen: 165, rating: 4.9, notes: 'Consistent performance' },
    ],
    documents: [
      { id: 'sd-1', name: 'BAMS Degree Certificate.pdf', type: 'Qualification', uploadedAt: 'Jan 2019', size: '420 KB' },
      { id: 'sd-2', name: 'Medical Council Registration.pdf', type: 'License', uploadedAt: 'Jan 2019', size: '180 KB' },
      { id: 'sd-3', name: 'Panchakarma Certification.pdf', type: 'Certification', uploadedAt: 'Mar 2020', size: '256 KB' },
    ],
    leaveRecords: [
      { id: 'lv-1', type: 'Casual Leave', from: 'Aug 15, 2023', to: 'Aug 16, 2023', days: 2, status: 'Approved' },
      { id: 'lv-2', type: 'Conference', from: 'Jun 5, 2023', to: 'Jun 7, 2023', days: 3, status: 'Approved' },
    ],
  },
};

const defaultMetrics = (member: StaffMember): StaffMetrics => ({
  patientsToday: member.today,
  totalHandled: member.statPrimary.value,
  totalLabel: member.statPrimary.label,
  rating: member.rating,
  shiftHours: member.status === 'On Duty' ? '8 hrs' : '—',
});

const defaultTodaySchedule = (member: StaffMember): StaffScheduleSlot[] => {
  if (member.status === 'Off Duty') return [];
  return [
    {
      id: `${member.id}-ts-1`,
      time: '10:30 AM',
      title: member.role === 'Support' ? 'Front Desk' : 'Consultation',
      patientOrTask: member.role === 'Support' ? 'Reception duties' : 'Morning session',
      status: 'Completed',
    },
    {
      id: `${member.id}-ts-2`,
      time: '2:00 PM',
      title: member.role === 'Therapist' ? 'Therapy Session' : 'Afternoon slot',
      patientOrTask: member.tags[0] ?? 'General',
      status: 'Upcoming',
    },
  ];
};

const defaultActivity = (member: StaffMember): StaffActivity[] => [
  {
    id: `${member.id}-act-1`,
    title: `${member.role} — ${member.title}`,
    dateRange: 'Oct 2023',
    status: member.status === 'On Duty' ? 'Active' : 'Completed',
    description: `${member.name} is currently serving in ${member.title}. Specializes in ${member.tags.join(', ')}.`,
    tags: member.tags,
  },
  {
    id: `${member.id}-act-2`,
    title: 'Monthly Performance Review',
    dateRange: 'Sep 30, 2023',
    status: 'Completed',
    description: `Reviewed ${member.statPrimary.value} total ${member.statPrimary.label.toLowerCase()} with ${member.rating}★ rating.`,
    tags: ['Review'],
  },
];

const defaultWeeklySchedule = (member: StaffMember): StaffScheduleSlot[] =>
  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => ({
    id: `${member.id}-ws-${i}`,
    time: `${day} ${member.shift.split('–')[0]?.trim() ?? '9AM'}`,
    title: member.role,
    patientOrTask: member.title,
    status: i < 3 ? 'Completed' : i === 3 ? 'In Progress' : 'Upcoming',
  }));

const defaultAssignments = (member: StaffMember): StaffAssignment[] => {
  if (member.role === 'Support') {
    return [
      {
        id: `${member.id}-as-1`,
        patientName: '—',
        patientId: '—',
        program: 'Front Desk Operations',
        since: member.shift,
        status: 'Active',
      },
    ];
  }
  return [
    {
      id: `${member.id}-as-1`,
      patientName: 'Active caseload',
      patientId: '—',
      program: member.tags[0] ?? 'General',
      since: 'Oct 2023',
      status: 'Active',
    },
  ];
};

const defaultPerformance = (member: StaffMember): StaffPerformanceRecord[] => [
  { id: `${member.id}-pr-1`, month: 'Oct 2023', patientsSeen: member.today * 20, rating: member.rating, notes: 'Current month' },
  { id: `${member.id}-pr-2`, month: 'Sep 2023', patientsSeen: member.statPrimary.value / 2, rating: member.rating - 0.1, notes: 'Steady output' },
];

const defaultDocuments = (member: StaffMember): StaffDocument[] => [
  {
    id: `${member.id}-doc-1`,
    name: 'Staff ID Card.pdf',
    type: 'Identity',
    uploadedAt: member.shift,
    size: '120 KB',
  },
  {
    id: `${member.id}-doc-2`,
    name: 'Employment Contract.pdf',
    type: 'HR',
    uploadedAt: 'On joining',
    size: '340 KB',
  },
];

const defaultLeave = (member: StaffMember): LeaveRecord[] => [
  {
    id: `${member.id}-lv-1`,
    type: 'Casual Leave',
    from: '—',
    to: '—',
    days: 0,
    status: member.status === 'Off Duty' ? 'Approved' : 'Pending',
  },
];

export const buildStaffDetail = (base: StaffMember): StaffDetail => {
  const override = DETAIL_OVERRIDES[base.id];
  return {
    ...base,
    email: override?.email ?? `${base.initials.toLowerCase()}@ayurvedahealth.com`,
    phone: override?.phone ?? '+91 90000 00000',
    department: override?.department ?? base.title,
    joinedDate: override?.joinedDate ?? 'Jan 2022',
    experience: override?.experience ?? '2 yrs',
    metrics: override?.metrics ?? defaultMetrics(base),
    todaySchedule: override?.todaySchedule ?? defaultTodaySchedule(base),
    activityLog: override?.activityLog ?? defaultActivity(base),
    weeklySchedule: override?.weeklySchedule ?? defaultWeeklySchedule(base),
    assignments: override?.assignments ?? defaultAssignments(base),
    performanceRecords: override?.performanceRecords ?? defaultPerformance(base),
    documents: override?.documents ?? defaultDocuments(base),
    leaveRecords: override?.leaveRecords ?? defaultLeave(base),
  };
};

export const getStaffById = (staffId: string): StaffMember | null =>
  MOCK_STAFF.find((s) => s.id === staffId) ?? null;

export const staffToForm = (member: StaffMember) => ({
  name: member.name,
  role: member.role,
  title: member.title,
  shift: member.shift,
});
