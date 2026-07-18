import { Schema, model } from 'mongoose';

const medicineTimingSchema = new Schema(
  {
    morningBefore: { type: Boolean, default: false },
    morningAfter: { type: Boolean, default: false },
    afternoonBefore: { type: Boolean, default: false },
    afternoonAfter: { type: Boolean, default: false },
    eveningBefore: { type: Boolean, default: false },
    eveningAfter: { type: Boolean, default: false },
    nightBefore: { type: Boolean, default: false },
    nightAfter: { type: Boolean, default: false },
    bedtime: { type: Boolean, default: false },
  },
  { _id: false }
);

const prescriptionMedicineSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    itemCode: { type: String, default: '' },
    isManual: { type: Boolean, default: false },
    packQuantity: { type: Number, default: 1, min: 1 },
    timing: { type: medicineTimingSchema, default: () => ({}) },
    totalQuantity: { type: Number, required: true, min: 1 },
    intakeInstructions: { type: String, default: '' },
  },
  { _id: true }
);

const churanPowderSchema = new Schema(
  {
    itemCode: { type: String, default: '' },
    name: { type: String, required: true, trim: true },
    quantitySpoons: { type: Number, min: 0.01 },
    spoonGrams: { type: Number, min: 0.01 },
    quantityGrams: { type: Number, required: true, min: 0.01 },
  },
  { _id: false }
);

const prescriptionChuranSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    combination: { type: String, default: '' },
    powders: { type: [churanPowderSchema], default: [] },
    intakeSpoons: { type: Number, min: 0 },
    intakeSpoonGrams: { type: Number, min: 0 },
    howToIntake: { type: String, default: '' },
  },
  { _id: true }
);

const actorSchema = new Schema(
  {
    type: { type: String, enum: ['admin', 'staff'], required: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    staffCode: { type: String, default: '' },
    name: { type: String, default: '' },
  },
  { _id: false }
);

const hmsStructuredPrescriptionSchema = new Schema({
  prescriptionCode: { type: String, unique: true, required: true, trim: true },
  patientCode: { type: String, required: true, index: true },
  patient: { type: Schema.Types.ObjectId, ref: 'HmsPatient', required: true },
  patientName: { type: String, required: true, trim: true },
  appointmentCode: { type: String, default: '', index: true },
  doctorStaffCode: { type: String, default: '' },
  doctorName: { type: String, default: '' },
  diagnosis: { type: String, default: '' },
  remarks: { type: String, default: '' },
  medicines: { type: [prescriptionMedicineSchema], default: [] },
  churans: { type: [prescriptionChuranSchema], default: [] },
  recommendedTests: {
    type: [
      {
        testCode: { type: String, required: true, trim: true },
        testName: { type: String, required: true, trim: true },
        categoryCode: { type: String, default: '' },
        categoryName: { type: String, default: '' },
      },
    ],
    default: [],
  },
  labOrderCode: { type: String, default: '' },
  createdBy: { type: actorSchema, default: null },
  whatsappSentAt: { type: Date, default: null },
  whatsappSentBy: { type: actorSchema, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

hmsStructuredPrescriptionSchema.pre('save', function setUpdated(next) {
  this.updatedAt = new Date();
  next();
});

export default model('HmsStructuredPrescription', hmsStructuredPrescriptionSchema);
