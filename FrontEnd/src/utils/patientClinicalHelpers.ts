import type { PatientClinicalProfile } from '@/types/patientClinical.types';

export const emptyClinicalProfile = (): PatientClinicalProfile => ({
  presentComplaint: { complaint: '' },
  generalExamination: {
    prakriti: '',
    nadi: '',
    jivha: '',
    stool: '',
    urine: '',
    hunger: '',
    digestion: '',
    sleep: '',
    intolerance: '',
    periods: '',
  },
  diseaseHistory: {
    skin: '',
    migrane: '',
    chicken: '',
    jaundice: '',
    bronchitis: '',
    anorectal: '',
    amlaPitta: '',
    menstrual: '',
    bowel: '',
    addiction: '',
    geneticDisorder: '',
    accidentalHistory: '',
  },
  diabetesHistory: {
    diabetesType: '',
    typeDurations: '',
    insulin: '',
    insulinDurations: '',
    currentMedicine: '',
    currentMedicineDurations: '',
  },
  metabolicDisorder: {
    bpMedicine: '',
    bpMedicineDurations: '',
    cholesterolMedicine: '',
    cholesterolMedicineDurations: '',
    thyroidMedicine: '',
    thyroidMedicineDurations: '',
    pcosMedicine: '',
    pcosMedicineDurations: '',
    retinopathyMedicine: '',
    retinopathyMedicineDurations: '',
    nephropathyMedicine: '',
    nephropathyMedicineDurations: '',
    neuropathyMedicine: '',
    neuropathyMedicineDurations: '',
    obesityMedicine: '',
    obesityMedicineDurations: '',
    otherMedicine: '',
    otherMedicineDurations: '',
    lifestyleMedicine: '',
    lifestyleMedicineDurations: '',
  },
  eatingHabits: {
    preference: '',
    schedule: '',
    quantity: '',
    likes: '',
    dislikes: '',
  },
  physicalActivity: {
    active: null,
    workPattern: '',
    walk: '',
    yoga: '',
    exercise: '',
    meditative: '',
  },
  physicalMeasurement: {
    bicep: '',
    waist: '',
    hip: '',
    height: '',
    weight: '',
    bmi: '',
    whr: '',
  },
  updatedAt: null,
});

const parseNum = (value: string) => {
  const n = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Height stored in cm, weight in kg */
export const computeBmi = (heightCm: string, weightKg: string) => {
  const h = parseNum(heightCm);
  const w = parseNum(weightKg);
  if (!h || !w) return '';
  const heightM = h / 100;
  if (heightM <= 0) return '';
  const bmi = w / (heightM * heightM);
  return bmi > 0 ? bmi.toFixed(1) : '';
};

export const getBmiCategory = (bmi: string) => {
  const n = Number(bmi);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n < 18.5) return 'Underweight';
  if (n < 25) return 'Normal';
  if (n < 30) return 'Overweight';
  if (n < 35) return 'Obese Class I';
  if (n < 40) return 'Obese Class II';
  return 'Obese Class III';
};

export const cmToInches = (cm: string) => {
  const n = parseNum(cm);
  if (!n) return '';
  return (n / 2.54).toFixed(1);
};

export const inchesToCm = (inches: string) => {
  const n = parseNum(inches);
  if (!n) return '';
  return (n * 2.54).toFixed(1);
};

export const computeWhr = (waist: string, hip: string) => {
  const w = parseNum(waist);
  const h = parseNum(hip);
  if (!w || !h) return '';
  const whr = w / h;
  return whr > 0 ? whr.toFixed(2) : '';
};

export const withComputedMeasurements = (
  measurement: PatientClinicalProfile['physicalMeasurement']
) => {
  const bmi = computeBmi(measurement.height, measurement.weight);
  const whr = computeWhr(measurement.waist, measurement.hip);
  return {
    ...measurement,
    bmi,
    whr,
  };
};

export const mergeClinicalFromApi = (clinical?: Partial<PatientClinicalProfile> | null) => {
  const empty = emptyClinicalProfile();
  if (!clinical) return empty;
  return {
    presentComplaint: { ...empty.presentComplaint, ...clinical.presentComplaint },
    generalExamination: { ...empty.generalExamination, ...clinical.generalExamination },
    diseaseHistory: { ...empty.diseaseHistory, ...clinical.diseaseHistory },
    diabetesHistory: {
      ...empty.diabetesHistory,
      ...clinical.diabetesHistory,
      diabetesType:
        clinical.diabetesHistory?.diabetesType ??
        (clinical.diabetesHistory as { type?: string })?.type ??
        '',
    },
    metabolicDisorder: { ...empty.metabolicDisorder, ...clinical.metabolicDisorder },
    eatingHabits: { ...empty.eatingHabits, ...clinical.eatingHabits },
    physicalActivity: { ...empty.physicalActivity, ...clinical.physicalActivity },
    physicalMeasurement: withComputedMeasurements({
      ...empty.physicalMeasurement,
      ...clinical.physicalMeasurement,
    }),
    updatedAt: clinical.updatedAt ?? null,
  };
};

const MOCK_CLINICAL_KEY = 'hms-patient-clinical';

export const loadMockClinical = (patientCode: string): PatientClinicalProfile => {
  try {
    const raw = localStorage.getItem(`${MOCK_CLINICAL_KEY}:${patientCode}`);
    if (!raw) return emptyClinicalProfile();
    return mergeClinicalFromApi(JSON.parse(raw) as PatientClinicalProfile);
  } catch {
    return emptyClinicalProfile();
  }
};

export const saveMockClinical = (patientCode: string, clinical: PatientClinicalProfile) => {
  localStorage.setItem(`${MOCK_CLINICAL_KEY}:${patientCode}`, JSON.stringify(clinical));
};

/** Payload for PATCH /clinical — omit read-only fields */
export const clinicalPayloadForApi = (clinical: PatientClinicalProfile) => {
  const { updatedAt: _u, ...rest } = clinical;
  return rest;
};
