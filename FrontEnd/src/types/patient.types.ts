export type PatientStatus = 'Active' | 'Pending' | 'Inactive';

export interface PatientFormValues {
  name: string;
  prakritiId: string;
  age: number | '';
  lastVisit: string;
  treatmentId: string;
  status: PatientStatus;
  mobile: string;
  email: string;
}

/** Demographics editable from patient detail sidebar */
export interface PatientProfileFormValues {
  name: string;
  age: number | '';
  gender: string;
  bloodGroup: string;
  email: string;
  mobile: string;
  city: string;
  prakritiId: string;
  treatmentId: string;
  status: PatientStatus;
}

export interface Patient extends Omit<PatientFormValues, 'age'> {
  id: string;
  age: number;
  prakriti: string;
  treatment: string;
  initials: string;
  avatarClass: string;
  lastVisit: string;
}

export interface PatientStats {
  total: number;
  newThisWeek: number;
}
