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

export interface PrescriptionMedicine {
  id?: string;
  name: string;
  itemCode?: string;
  isManual?: boolean;
  packQuantity: number;
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

export const buildChuranCombination = (powders: ChuranPowderComponent[] = []) =>
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

export const TIMING_LABELS: { key: keyof MedicineTiming; label: string; title: string }[] = [
  { key: 'morningBefore', label: 'MB', title: 'Morning before meal' },
  { key: 'morningAfter', label: 'MA', title: 'Morning after meal' },
  { key: 'afternoonBefore', label: 'AB', title: 'Afternoon before meal' },
  { key: 'afternoonAfter', label: 'AA', title: 'Afternoon after meal' },
  { key: 'eveningBefore', label: 'EB', title: 'Evening before meal' },
  { key: 'eveningAfter', label: 'EA', title: 'Evening after meal' },
  { key: 'nightBefore', label: 'NB', title: 'Night before meal' },
  { key: 'nightAfter', label: 'NA', title: 'Night after meal' },
  { key: 'bedtime', label: 'BT', title: 'Bedtime' },
];

export const countMedicineDoses = (timing: MedicineTiming = {}) =>
  TIMING_LABELS.reduce((sum, { key }) => sum + (timing[key] ? 1 : 0), 0);

export const computeMedicineTotalQty = (packQuantity: number, timing: MedicineTiming = {}) => {
  const perDay = countMedicineDoses(timing);
  const packs = packQuantity || 1;
  return Math.max(1, perDay * packs);
};
