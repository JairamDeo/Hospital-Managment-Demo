export type PatientStatus = 'Active' | 'Pending' | 'Inactive';

export interface PatientFormValues {
  name: string;
  age: number | '';
  gender: 'Male' | 'Female' | '';
  bloodGroup: string;
  address: string;
  mobile: string;
  email: string;
  /** Kept for edit flows / legacy mapping */
  prakritiId: string;
  lastVisit: string;
  treatmentId: string;
  status: PatientStatus;
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
