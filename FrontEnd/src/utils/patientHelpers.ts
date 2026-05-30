import type { Patient, PatientFormValues, PrakritiType, PatientStatus } from '@/pages/patients/data/mockPatients';

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

export const generatePatientId = (existing: Patient[]) => {
  const nums = existing
    .map((p) => parseInt(p.id.replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 10073;
  return `AH-${next}`;
};

export const formatVisitDate = (iso: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const parseVisitToInput = (display: string) => {
  const d = new Date(display);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

export const formToPatient = (
  values: PatientFormValues,
  id: string,
  existing?: Patient
): Patient => ({
  id,
  name: values.name.trim(),
  prakriti: values.prakriti,
  age: values.age,
  lastVisit: formatVisitDate(values.lastVisit),
  treatment: values.treatment.trim(),
  status: values.status,
  mobile: values.mobile.trim(),
  email: values.email.trim(),
  initials: getInitialsFromName(values.name),
  avatarClass: existing?.avatarClass ?? pickAvatarClass(values.name),
});

export const patientToForm = (p: Patient): PatientFormValues => ({
  name: p.name,
  prakriti: p.prakriti,
  age: p.age,
  lastVisit: parseVisitToInput(p.lastVisit),
  treatment: p.treatment,
  status: p.status,
  mobile: p.mobile ?? '',
  email: p.email ?? '',
});

export const emptyPatientForm = (): PatientFormValues => ({
  name: '',
  prakriti: 'Vata',
  age: 30,
  lastVisit: new Date().toISOString().slice(0, 10),
  treatment: 'General Consult',
  status: 'Active',
  mobile: '',
  email: '',
});

export const PRAKRITI_OPTIONS: PrakritiType[] = ['Vata', 'Pitta', 'Kapha'];
export const STATUS_OPTIONS: PatientStatus[] = ['Active', 'Pending', 'Inactive'];

export const TREATMENT_OPTIONS = [
  'General Consult',
  'Panchakarma',
  'Follow-up',
  'Diet Consult',
  'Lab Review',
];

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
