import type { PharmacyItemApi } from '@/types/pharmacy.types';

export interface MedicineTiming {
  morningBefore?: boolean;
  morningAfter?: boolean;
  afternoonBefore?: boolean;
  afternoonAfter?: boolean;
  eveningBefore?: boolean;
  eveningAfter?: boolean;
  nightBefore?: boolean;
  nightAfter?: boolean;
  bedtime?: boolean;
}

export type MedicineFrequency = 'daily' | 'weekly';

export interface PrescriptionMedicine {
  id?: string;
  name: string;
  itemCode?: string;
  isManual?: boolean;
  /** Packs/units for solid meds; unused for liquids (see mlIntake) */
  packQuantity: number;
  /** Dose in ml when medicine is liquid */
  mlIntake?: number;
  isLiquid?: boolean;
  durationDays: number;
  frequency: MedicineFrequency;
  timing: MedicineTiming;
  totalQuantity: number;
  intakeInstructions?: string;
}

export interface ChuranPowderComponent {
  itemCode: string;
  name: string;
  quantitySpoons: number;
  spoonGrams: number;
  quantityGrams: number;
}

export interface PrescriptionChuran {
  id?: string;
  name: string;
  combination: string;
  powders?: ChuranPowderComponent[];
  intakeSpoons?: number;
  intakeSpoonGrams?: number;
  intakeNote?: string;
  howToIntake: string;
}

export const powderGramsFromSpoons = (quantitySpoons: number, spoonGrams: number) =>
  Math.round(quantitySpoons * spoonGrams * 1000) / 1000;

type ChuranCombinationSource = Pick<
  ChuranPowderComponent,
  'name' | 'quantitySpoons' | 'spoonGrams' | 'quantityGrams'
>;

export const buildChuranCombination = (powders: ChuranCombinationSource[] = []) =>
  powders
    .filter((p) => p.name.trim() && p.quantityGrams > 0)
    .map((p) => {
      const spoons = p.quantitySpoons;
      const grams = p.quantityGrams;
      if (spoons > 0 && p.spoonGrams > 0) {
        const spoonLabel = spoons === 1 ? 'spoon' : 'spoons';
        return `${p.name.trim()} ${spoons} ${spoonLabel} (${grams}g)`;
      }
      return `${p.name.trim()} ${grams}g`;
    })
    .join(', ');

export const buildChuranIntakeText = (
  intakeSpoons: number,
  intakeSpoonGrams: number,
  note = ''
) => {
  if (!intakeSpoons || intakeSpoons <= 0) return note.trim();
  const spoonLabel = intakeSpoons === 1 ? 'spoon' : 'spoons';
  const base =
    intakeSpoonGrams > 0
      ? `Take ${intakeSpoons} ${spoonLabel} (${intakeSpoonGrams}g each)`
      : `Take ${intakeSpoons} ${spoonLabel}`;
  const extra = note.trim();
  return extra ? `${base}. ${extra}` : base;
};

export const maxSpoonsForPowderStock = (stockGrams: number, spoonGrams: number) => {
  if (!spoonGrams || spoonGrams <= 0) return 0;
  return Math.max(0, Math.floor(stockGrams / spoonGrams));
};

export interface RecommendedLabTest {
  testCode: string;
  testName: string;
  categoryCode?: string;
  categoryName?: string;
}

export interface StructuredPrescription {
  _id: string;
  prescriptionCode: string;
  patientCode: string;
  patientName: string;
  appointmentCode: string;
  doctorStaffCode: string;
  doctorName: string;
  diagnosis: string;
  remarks: string;
  medicines: PrescriptionMedicine[];
  churans: PrescriptionChuran[];
  recommendedTests?: RecommendedLabTest[];
  labOrderCode?: string;
  createdAt?: string;
  updatedAt?: string;
  whatsappSentAt?: string | null;
  whatsappSentBy?: string;
}

export interface StructuredPrescriptionPayload {
  appointmentCode?: string;
  doctorStaffCode?: string;
  doctorName?: string;
  diagnosis?: string;
  remarks?: string;
  medicines?: PrescriptionMedicine[];
  churans?: PrescriptionChuran[];
  recommendedTests?: RecommendedLabTest[];
}

/** Active timing slots shown in the editor (evening removed) */
export const TIMING_LABELS: { key: keyof MedicineTiming; label: string; title: string }[] = [
  { key: 'morningBefore', label: 'MBM', title: 'Morning before meal' },
  { key: 'morningAfter', label: 'MAM', title: 'Morning after meal' },
  { key: 'afternoonBefore', label: 'ABM', title: 'Afternoon before meal' },
  { key: 'nightBefore', label: 'NBM', title: 'Night before meal' },
  { key: 'nightAfter', label: 'NAM', title: 'Night after meal' },
  { key: 'bedtime', label: 'BTM', title: 'Bedtime' },
];

export const isLiquidMedicine = (item?: PharmacyItemApi | null, name = '') => {
  const text = [
    item?.name,
    name,
    item?.unitSize,
    item?.subtitle,
    item?.category,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return /\b(ml|juice|kwath|kwatha|arishta|asava|syrup|oil|liquid|decoction|kadha|tonic|ghrita)\b/.test(
    text
  );
};

export const countMedicineDoses = (timing: MedicineTiming = {}) =>
  TIMING_LABELS.reduce((sum, { key }) => sum + (timing[key] ? 1 : 0), 0);

export const computeMedicineTotalQty = (
  packQuantity: number,
  timing: MedicineTiming = {},
  options?: { durationDays?: number; frequency?: MedicineFrequency; mlIntake?: number; isLiquid?: boolean }
) => {
  const perDay = countMedicineDoses(timing);
  const duration = Math.max(1, Number(options?.durationDays) || 1);
  const qty = options?.isLiquid
    ? Math.max(1, Number(options.mlIntake) || 1)
    : Math.max(1, Number(packQuantity) || 1);
  // daily: every day for N days; weekly: once a week for N weeks
  return Math.max(1, perDay * qty * duration);
};
