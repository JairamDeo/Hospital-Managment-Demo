export interface PatientVitalsEntry {
  id: string;
  date: string;
  bp: string;
  fasting: string;
  postMeal: string;
  random: string;
  weight: string;
  recordedByName: string;
}

export interface PatientVitalsPayload {
  bp?: string;
  fasting?: string;
  postMeal?: string;
  random?: string;
  weight?: string;
}
