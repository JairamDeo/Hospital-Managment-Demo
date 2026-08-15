import type { HmsPatient } from '@/types/api.types';
import type {
  Patient,
  PatientFormValues,
  PatientProfileFormValues,
  PatientStatus,
} from '@/types/patient.types';
import type { PatientDetail } from '@/types/patientDetail.types';

const AVATAR_CLASSES = [
  'bg-blue-100 text-blue-700',
  'bg-pink-100 text-pink-700',
  'bg-emerald-100 text-emerald-800',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-800',
  'bg-teal-100 text-teal-800',
];

export const getInitialsFromName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export const pickAvatarClass = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash += seed.charCodeAt(i);
  return AVATAR_CLASSES[hash % AVATAR_CLASSES.length];
};

export const formatVisitDate = (iso: string | Date | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const parseVisitToInput = (display: string) => {
  const d = new Date(display);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
};

export const hmsToPatient = (p: HmsPatient): Patient => ({
  id: p.patientCode,
  name: p.name,
  prakritiId: p.prakritiId ?? '',
  prakriti: p.prakritiName ?? p.prakriti ?? '—',
  treatmentId: p.treatmentId ?? '',
  treatment: p.treatmentName ?? p.treatment ?? '—',
  age: p.age ?? 0,
  lastVisit: formatVisitDate(p.lastVisit),
  status: (p.recordStatus ?? p.status ?? 'Active') as PatientStatus,
  mobile: p.mobile ?? p.mobileNumber ?? '',
  email: p.email ?? '',
  initials: getInitialsFromName(p.name),
  avatarClass: pickAvatarClass(p.name),
});

export const formToPatient = (
  values: PatientFormValues,
  id: string,
  existing?: Patient,
  prakritiName?: string,
  treatmentName?: string
): Patient => ({
  id,
  name: values.name.trim(),
  prakritiId: values.prakritiId,
  prakriti: prakritiName ?? existing?.prakriti ?? '—',
  treatmentId: values.treatmentId,
  treatment: treatmentName ?? existing?.treatment ?? '—',
  age: values.age === '' ? 0 : values.age,
  lastVisit: formatVisitDate(values.lastVisit),
  status: values.status,
  mobile: values.mobile.trim(),
  email: values.email.trim(),
  initials: getInitialsFromName(values.name),
  avatarClass: existing?.avatarClass ?? pickAvatarClass(values.name),
});

export const patientToForm = (p: Patient): PatientFormValues => ({
  name: p.name,
  prakritiId: p.prakritiId,
  age: p.age,
  lastVisit: parseVisitToInput(p.lastVisit),
  treatmentId: p.treatmentId,
  status: p.status,
  mobile: p.mobile ?? '',
  email: p.email ?? '',
});

export const detailToProfileForm = (p: PatientDetail): PatientProfileFormValues => ({
  name: p.name,
  age: p.age,
  gender: p.gender || 'Not recorded',
  bloodGroup: p.bloodGroup === '—' ? '' : p.bloodGroup,
  email: p.email ?? '',
  mobile: p.mobile ?? '',
  city: p.city ?? '',
  prakritiId: p.prakritiId,
  treatmentId: p.treatmentId,
  status: p.status,
});

export const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Not recorded'] as const;

export const BLOOD_GROUP_OPTIONS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const emptyPatientForm = (): PatientFormValues => ({
  name: '',
  prakritiId: '',
  age: '',
  lastVisit: new Date().toISOString().slice(0, 10),
  treatmentId: '',
  status: 'Active',
  mobile: '',
  email: '',
});

export const STATUS_OPTIONS: PatientStatus[] = ['Active', 'Pending', 'Inactive'];

export type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'age-asc'
  | 'age-desc'
  | 'visit-newest'
  | 'visit-oldest'
  | 'status';

export const SORT_LABELS: Record<SortOption, string> = {
  'name-asc': 'Name (A → Z)',
  'name-desc': 'Name (Z → A)',
  'age-asc': 'Age (Low → High)',
  'age-desc': 'Age (High → Low)',
  'visit-newest': 'Last visit (Newest)',
  'visit-oldest': 'Last visit (Oldest)',
  status: 'Status',
};

export const sortPatients = (list: Patient[], sort: SortOption): Patient[] => {
  const copy = [...list];
  const statusOrder = { Active: 0, Pending: 1, Inactive: 2 };
  copy.sort((a, b) => {
    switch (sort) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'age-asc':
        return a.age - b.age;
      case 'age-desc':
        return b.age - a.age;
      case 'visit-newest':
        return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
      case 'visit-oldest':
        return new Date(a.lastVisit).getTime() - new Date(b.lastVisit).getTime();
      case 'status':
        return statusOrder[a.status] - statusOrder[b.status];
      default:
        return 0;
    }
  });
  return copy;
};
