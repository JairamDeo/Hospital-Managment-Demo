export const MENSTRUAL_DETAIL_FIELDS = [
  {
    key: 'ageAtMenarche' as const,
    label: 'Age at Menarche (पहली माहवारी की उम्र)',
    placeholder: 'उम्र (वर्ष)',
  },
  {
    key: 'lmp' as const,
    label: 'LMP – Last Menstrual Period',
    placeholder: 'DD/MM/YYYY',
  },
  {
    key: 'cycleInterval' as const,
    label: 'Cycle Interval (माहवारी का अंतर)',
    placeholder: 'जैसे 28–30 days',
  },
  {
    key: 'durationOfFlow' as const,
    label: 'Duration of Flow (ब्लीडिंग कितने दिन)',
    placeholder: 'जैसे 3–5 days',
  },
  {
    key: 'amountOfFlow' as const,
    label: 'Amount of Flow (रक्तस्राव की मात्रा)',
    placeholder: 'Scanty / Moderate / Heavy',
    options: ['Scanty', 'Moderate', 'Heavy'],
  },
  {
    key: 'cycleRegularity' as const,
    label: 'Cycle Regularity',
    placeholder: 'Regular / Irregular',
    options: ['Regular', 'Irregular'],
  },
  {
    key: 'padsPerDay' as const,
    label: 'Pads Used Per Day',
    placeholder: 'संख्या',
  },
  {
    key: 'clots' as const,
    label: 'Clots (रक्त के थक्के)',
    placeholder: 'Present / Absent',
    options: ['Present', 'Absent'],
  },
];

export const MENSTRUAL_PAIN_SYMPTOMS = [
  { id: 'dysmenorrhea', label: 'Dysmenorrhea – माहवारी में पेट दर्द' },
  { id: 'lowerAbdominalPain', label: 'Lower Abdominal Pain – पेट के निचले हिस्से में दर्द' },
  { id: 'lowBackPain', label: 'Low Back Pain – कमर दर्द' },
  { id: 'legPain', label: 'Leg Pain – पैरों में दर्द' },
  { id: 'breastTenderness', label: 'Breast Tenderness – स्तनों में दर्द' },
  { id: 'headacheMigraine', label: 'Headache / Migraine – सिरदर्द' },
] as const;

export const MENSTRUAL_FLOW_SYMPTOMS = [
  { id: 'amenorrhea', label: 'Amenorrhea – माहवारी न आना' },
  { id: 'oligomenorrhea', label: 'Oligomenorrhea – माहवारी में अधिक अंतर' },
  { id: 'polymenorrhea', label: 'Polymenorrhea – बार-बार माहवारी आना' },
  {
    id: 'menorrhagia',
    label: 'Menorrhagia / Heavy Menstrual Bleeding – अधिक रक्तस्राव',
  },
  { id: 'hypomenorrhea', label: 'Hypomenorrhea – कम रक्तस्राव' },
  {
    id: 'intermenstrualBleeding',
    label: 'Intermenstrual Bleeding – दो माहवारी के बीच रक्तस्राव',
  },
  { id: 'spotting', label: 'Spotting – हल्के धब्बे' },
  { id: 'passageOfClots', label: 'Passage of Clots – रक्त के थक्के' },
] as const;

export const MENSTRUAL_ASSOCIATED_SYMPTOMS = [
  { id: 'leucorrhea', label: 'White Discharge / Leucorrhea – सफेद पानी' },
  { id: 'nauseaVomiting', label: 'Nausea / Vomiting – जी मिचलाना / उल्टी' },
  { id: 'bloating', label: 'Bloating – पेट फूलना' },
  { id: 'fatigue', label: 'Fatigue / Weakness – थकान / कमजोरी' },
  { id: 'moodSwings', label: 'Mood Swings – मूड में बदलाव' },
  { id: 'irritability', label: 'Irritability – चिड़चिड़ापन' },
  { id: 'acne', label: 'Acne – मुहासे' },
  { id: 'breastSwelling', label: 'Breast Swelling – स्तनों में सूजन' },
  { id: 'feverDuringMenses', label: 'Fever During Menses – माहवारी के दौरान बुखार' },
] as const;
