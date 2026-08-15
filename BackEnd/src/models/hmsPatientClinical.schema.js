import { Schema } from 'mongoose';

const trimStr = { type: String, trim: true, default: '' };

export const generalExaminationSchema = new Schema(
  {
    prakriti: trimStr,
    nadi: trimStr,
    jivha: trimStr,
    stool: trimStr,
    urine: trimStr,
    hunger: trimStr,
    digestion: trimStr,
    sleep: trimStr,
    intolerance: trimStr,
  },
  { _id: false }
);

export const diseaseHistorySchema = new Schema(
  {
    skin: trimStr,
    migrane: trimStr,
    chicken: trimStr,
    jaundice: trimStr,
    bronchitis: trimStr,
    anorectal: trimStr,
    amlaPitta: trimStr,
    menstrual: trimStr,
    bowel: trimStr,
    addiction: trimStr,
    geneticDisorder: trimStr,
    accidentalHistory: trimStr,
  },
  { _id: false }
);

export const diabetesHistorySchema = new Schema(
  {
    diabetesType: trimStr,
    typeDurations: trimStr,
    insulin: trimStr,
    insulinDurations: trimStr,
    currentMedicine: trimStr,
    currentMedicineDurations: trimStr,
  },
  { _id: false }
);

export const metabolicDisorderSchema = new Schema(
  {
    bpMedicine: trimStr,
    bpMedicineDurations: trimStr,
    cholesterolMedicine: trimStr,
    cholesterolMedicineDurations: trimStr,
    thyroidMedicine: trimStr,
    thyroidMedicineDurations: trimStr,
    pcosMedicine: trimStr,
    pcosMedicineDurations: trimStr,
    retinopathyMedicine: trimStr,
    retinopathyMedicineDurations: trimStr,
    nephropathyMedicine: trimStr,
    nephropathyMedicineDurations: trimStr,
    neuropathyMedicine: trimStr,
    neuropathyMedicineDurations: trimStr,
    obesityMedicine: trimStr,
    obesityMedicineDurations: trimStr,
    otherMedicine: trimStr,
    otherMedicineDurations: trimStr,
    lifestyleMedicine: trimStr,
    lifestyleMedicineDurations: trimStr,
  },
  { _id: false }
);

export const eatingHabitsSchema = new Schema(
  {
    preference: trimStr,
    schedule: trimStr,
    quantity: trimStr,
    likes: trimStr,
    dislikes: trimStr,
  },
  { _id: false }
);

export const physicalActivitySchema = new Schema(
  {
    active: { type: Boolean, default: null },
    workPattern: trimStr,
    walk: trimStr,
    yoga: trimStr,
    exercise: trimStr,
    meditative: trimStr,
  },
  { _id: false }
);

export const physicalMeasurementSchema = new Schema(
  {
    bicep: trimStr,
    waist: trimStr,
    hip: trimStr,
    height: trimStr,
    weight: trimStr,
    bmi: trimStr,
    whr: trimStr,
  },
  { _id: false }
);

export const presentComplaintSchema = new Schema(
  {
    complaint: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

export const clinicalProfileSchema = new Schema(
  {
    presentComplaint: presentComplaintSchema,
    generalExamination: generalExaminationSchema,
    diseaseHistory: diseaseHistorySchema,
    diabetesHistory: diabetesHistorySchema,
    metabolicDisorder: metabolicDisorderSchema,
    eatingHabits: eatingHabitsSchema,
    physicalActivity: physicalActivitySchema,
    physicalMeasurement: physicalMeasurementSchema,
    updatedAt: { type: Date },
  },
  { _id: false }
);
