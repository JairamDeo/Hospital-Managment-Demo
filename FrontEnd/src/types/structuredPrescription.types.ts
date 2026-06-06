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

export interface PrescriptionChuran {
  id?: string;
  name: string;
  combination: string;
  howToIntake: string;
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
  createdAt?: string;
  updatedAt?: string;
}

export interface StructuredPrescriptionPayload {
  appointmentCode?: string;
  doctorStaffCode?: string;
  doctorName?: string;
  diagnosis?: string;
  remarks?: string;
  medicines?: PrescriptionMedicine[];
  churans?: PrescriptionChuran[];
}

export const TIMING_LABELS: { key: keyof MedicineTiming; label: string }[] = [
  { key: 'morningBefore', label: 'Morning before meal' },
  { key: 'morningAfter', label: 'Morning after meal' },
  { key: 'afternoonBefore', label: 'Afternoon before meal' },
  { key: 'afternoonAfter', label: 'Afternoon after meal' },
  { key: 'eveningBefore', label: 'Evening before meal' },
  { key: 'eveningAfter', label: 'Evening after meal' },
  { key: 'nightBefore', label: 'Night before meal' },
  { key: 'nightAfter', label: 'Night after meal' },
  { key: 'bedtime', label: 'Bedtime' },
];

export const countMedicineDoses = (timing: MedicineTiming = {}) =>
  TIMING_LABELS.reduce((sum, { key }) => sum + (timing[key] ? 1 : 0), 0);

export const computeMedicineTotalQty = (packQuantity: number, timing: MedicineTiming = {}) => {
  const perDay = countMedicineDoses(timing);
  const packs = packQuantity || 1;
  return Math.max(1, perDay * packs);
};
