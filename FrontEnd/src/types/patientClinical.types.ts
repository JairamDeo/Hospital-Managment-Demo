export interface PresentComplaint {
  complaint: string;
}

export interface GeneralExamination {
  prakriti: string;
  nadi: string;
  jivha: string;
  stool: string;
  urine: string;
  hunger: string;
  digestion: string;
  sleep: string;
  intolerance: string;
}

export interface DiseaseHistory {
  skin: string;
  migrane: string;
  chicken: string;
  jaundice: string;
  bronchitis: string;
  anorectal: string;
  amlaPitta: string;
  menstrual: string;
  bowel: string;
  addiction: string;
  geneticDisorder: string;
  accidentalHistory: string;
}

export interface DiabetesHistory {
  diabetesType: string;
  typeDurations: string;
  insulin: string;
  insulinDurations: string;
  currentMedicine: string;
  currentMedicineDurations: string;
}

export interface MetabolicDisorder {
  bpMedicine: string;
  bpMedicineDurations: string;
  cholesterolMedicine: string;
  cholesterolMedicineDurations: string;
  thyroidMedicine: string;
  thyroidMedicineDurations: string;
  pcosMedicine: string;
  pcosMedicineDurations: string;
  retinopathyMedicine: string;
  retinopathyMedicineDurations: string;
  nephropathyMedicine: string;
  nephropathyMedicineDurations: string;
  neuropathyMedicine: string;
  neuropathyMedicineDurations: string;
  obesityMedicine: string;
  obesityMedicineDurations: string;
  otherMedicine: string;
  otherMedicineDurations: string;
  lifestyleMedicine: string;
  lifestyleMedicineDurations: string;
}

export interface EatingHabits {
  preference: string;
  schedule: string;
  quantity: string;
  likes: string;
  dislikes: string;
}

export interface PhysicalActivity {
  active: boolean | null;
  workPattern: string;
  walk: string;
  yoga: string;
  exercise: string;
  meditative: string;
}

export interface PhysicalMeasurement {
  bicep: string;
  waist: string;
  hip: string;
  height: string;
  weight: string;
  bmi: string;
  whr: string;
}

export interface PatientClinicalProfile {
  presentComplaint: PresentComplaint;
  generalExamination: GeneralExamination;
  diseaseHistory: DiseaseHistory;
  diabetesHistory: DiabetesHistory;
  metabolicDisorder: MetabolicDisorder;
  eatingHabits: EatingHabits;
  physicalActivity: PhysicalActivity;
  physicalMeasurement: PhysicalMeasurement;
  updatedAt: string | null;
}

export type ClinicalSectionKey =
  | 'presentComplaint'
  | 'generalExamination'
  | 'diseaseHistory'
  | 'diabetesHistory'
  | 'metabolicDisorder'
  | 'eatingHabits'
  | 'physicalActivity'
  | 'physicalMeasurement';
