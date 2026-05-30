export type PrakritiType = 'Vata' | 'Pitta' | 'Kapha';
export type PatientStatus = 'Active' | 'Pending' | 'Inactive';

export interface PatientFormValues {
  name: string;
  prakriti: PrakritiType;
  age: number;
  lastVisit: string;
  treatment: string;
  status: PatientStatus;
  mobile: string;
  email: string;
}

export interface Patient extends PatientFormValues {
  id: string;
  initials: string;
  avatarClass: string;
  lastVisit: string;
}

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'AH-10024',
    name: 'Rahul Singh',
    prakriti: 'Vata',
    age: 34,
    lastVisit: 'Oct 26, 2023',
    treatment: 'General Consult',
    status: 'Active',
    mobile: '9876543210',
    email: 'rahul.s@email.com',
    initials: 'RS',
    avatarClass: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'AH-10018',
    name: 'Priya Sharma',
    prakriti: 'Pitta',
    age: 28,
    lastVisit: 'Oct 25, 2023',
    treatment: 'Panchakarma',
    status: 'Active',
    mobile: '9123456780',
    email: 'priya.s@email.com',
    initials: 'PS',
    avatarClass: 'bg-pink-100 text-pink-700',
  },
  {
    id: 'AH-10031',
    name: 'Vijay Kumar',
    prakriti: 'Kapha',
    age: 45,
    lastVisit: 'Oct 24, 2023',
    treatment: 'Follow-up',
    status: 'Pending',
    mobile: '9988776655',
    email: 'vijay.k@email.com',
    initials: 'VK',
    avatarClass: 'bg-emerald-100 text-emerald-800',
  },
  {
    id: 'AH-10009',
    name: 'Ananya Desai',
    prakriti: 'Vata',
    age: 31,
    lastVisit: 'Oct 23, 2023',
    treatment: 'Diet Consult',
    status: 'Active',
    mobile: '9012345678',
    email: 'ananya.d@email.com',
    initials: 'AD',
    avatarClass: 'bg-violet-100 text-violet-700',
  },
  {
    id: 'AH-10055',
    name: 'Meera Joshi',
    prakriti: 'Pitta',
    age: 52,
    lastVisit: 'Oct 20, 2023',
    treatment: 'Panchakarma',
    status: 'Inactive',
    mobile: '8899001122',
    email: 'meera.j@email.com',
    initials: 'MJ',
    avatarClass: 'bg-amber-100 text-amber-800',
  },
  {
    id: 'AH-10072',
    name: 'Arjun Patel',
    prakriti: 'Kapha',
    age: 38,
    lastVisit: 'Oct 18, 2023',
    treatment: 'General Consult',
    status: 'Active',
    mobile: '8765432109',
    email: 'arjun.p@email.com',
    initials: 'AP',
    avatarClass: 'bg-teal-100 text-teal-800',
  },
];

export const PATIENT_STATS = {
  total: 1452,
  newThisWeek: 48,
};
