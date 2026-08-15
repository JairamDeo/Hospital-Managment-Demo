import Joi from 'joi';

const trimStr = Joi.string().trim().allow('').optional();
const section = (shape) => Joi.object(shape).optional();

const generalExaminationSchema = section({
  prakriti: trimStr,
  nadi: trimStr,
  jivha: trimStr,
  stool: trimStr,
  urine: trimStr,
  hunger: trimStr,
  digestion: trimStr,
  sleep: trimStr,
  intolerance: trimStr,
});

const diseaseHistorySchema = section({
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
});

const diabetesHistorySchema = section({
  diabetesType: trimStr,
  typeDurations: trimStr,
  insulin: trimStr,
  insulinDurations: trimStr,
  currentMedicine: trimStr,
  currentMedicineDurations: trimStr,
});

const metabolicDisorderSchema = section({
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
});

const eatingHabitsSchema = section({
  preference: trimStr,
  schedule: trimStr,
  quantity: trimStr,
  likes: trimStr,
  dislikes: trimStr,
});

const physicalActivitySchema = section({
  active: Joi.boolean().allow(null).optional(),
  workPattern: trimStr,
  walk: trimStr,
  yoga: trimStr,
  exercise: trimStr,
  meditative: trimStr,
});

const physicalMeasurementSchema = section({
  bicep: trimStr,
  waist: trimStr,
  hip: trimStr,
  height: trimStr,
  weight: trimStr,
  bmi: trimStr,
  whr: trimStr,
});

export const adminUpdatePatientClinicalSchema = Joi.object({
  presentComplaint: section({ complaint: trimStr }),
  generalExamination: generalExaminationSchema,
  diseaseHistory: diseaseHistorySchema,
  diabetesHistory: diabetesHistorySchema,
  metabolicDisorder: metabolicDisorderSchema,
  eatingHabits: eatingHabitsSchema,
  physicalActivity: physicalActivitySchema,
  physicalMeasurement: physicalMeasurementSchema,
}).min(1);
