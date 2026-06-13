const toPlain = (obj) => {
  if (!obj || typeof obj !== 'object') return {};
  return obj.toObject ? obj.toObject() : { ...obj };
};

export const emptyClinicalProfile = () => ({
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

const parseNum = (value) => {
  const n = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Height in cm, weight in kg */
export const computeBmi = (height, weight) => {
  const h = parseNum(height);
  const w = parseNum(weight);
  if (!h || !w) return '';
  const heightM = h > 3 ? h / 100 : h;
  if (heightM <= 0) return '';
  const bmi = w / (heightM * heightM);
  return bmi > 0 ? bmi.toFixed(1) : '';
};

/** Waist and hip in cm */
export const computeWhr = (waist, hip) => {
  const w = parseNum(waist);
  const h = parseNum(hip);
  if (!w || !h) return '';
  const whr = w / h;
  return whr > 0 ? whr.toFixed(2) : '';
};

export const enrichPhysicalMeasurement = (measurement = {}) => {
  const m = { ...measurement };
  m.bmi = computeBmi(m.height, m.weight);
  m.whr = computeWhr(m.waist, m.hip);
  return m;
};

const mergeSection = (defaults, incoming) => {
  const base = { ...defaults };
  const patch = toPlain(incoming);
  Object.keys(base).forEach((key) => {
    if (patch[key] !== undefined && patch[key] !== null) {
      base[key] = patch[key];
    }
  });
  return base;
};

export const formatClinicalProfile = (clinical) => {
  const empty = emptyClinicalProfile();
  if (!clinical) return empty;
  const raw = toPlain(clinical);
  return {
    presentComplaint: mergeSection(empty.presentComplaint, raw.presentComplaint),
    generalExamination: mergeSection(empty.generalExamination, raw.generalExamination),
    diseaseHistory: mergeSection(empty.diseaseHistory, raw.diseaseHistory),
    diabetesHistory: mergeSection(empty.diabetesHistory, {
      ...raw.diabetesHistory,
      diabetesType: raw.diabetesHistory?.diabetesType ?? raw.diabetesHistory?.type ?? '',
    }),
    metabolicDisorder: mergeSection(empty.metabolicDisorder, raw.metabolicDisorder),
    eatingHabits: mergeSection(empty.eatingHabits, raw.eatingHabits),
    physicalActivity: mergeSection(empty.physicalActivity, raw.physicalActivity),
    physicalMeasurement: enrichPhysicalMeasurement(
      mergeSection(empty.physicalMeasurement, raw.physicalMeasurement)
    ),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt).toISOString() : null,
  };
};

export const mergeClinicalProfile = (existing, payload) => {
  const current = formatClinicalProfile(existing);
  const empty = emptyClinicalProfile();

  const next = {
    presentComplaint: mergeSection(
      current.presentComplaint,
      payload.presentComplaint ?? empty.presentComplaint
    ),
    generalExamination: mergeSection(
      current.generalExamination,
      payload.generalExamination ?? empty.generalExamination
    ),
    diseaseHistory: mergeSection(
      current.diseaseHistory,
      payload.diseaseHistory ?? empty.diseaseHistory
    ),
    diabetesHistory: mergeSection(current.diabetesHistory, {
      ...(payload.diabetesHistory ?? empty.diabetesHistory),
      diabetesType:
        payload.diabetesHistory?.diabetesType ??
        payload.diabetesHistory?.type ??
        current.diabetesHistory.diabetesType,
    }),
    metabolicDisorder: mergeSection(
      current.metabolicDisorder,
      payload.metabolicDisorder ?? empty.metabolicDisorder
    ),
    eatingHabits: mergeSection(current.eatingHabits, payload.eatingHabits ?? empty.eatingHabits),
    physicalActivity: mergeSection(
      current.physicalActivity,
      payload.physicalActivity ?? empty.physicalActivity
    ),
    physicalMeasurement: enrichPhysicalMeasurement(
      mergeSection(
        current.physicalMeasurement,
        payload.physicalMeasurement ?? empty.physicalMeasurement
      )
    ),
    updatedAt: new Date(),
  };

  return next;
};
