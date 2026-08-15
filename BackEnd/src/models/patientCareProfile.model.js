import { Schema, model } from 'mongoose';

const vitalsSchema = new Schema(
  {
    temp: { type: String, default: '' },
    bp: { type: String, default: '' },
    pulse: { type: String, default: '' },
    spo2: { type: String, default: '' },
    bmi: { type: String, default: '' },
  },
  { _id: false }
);

const activeTreatmentSchema = new Schema(
  {
    program: { type: String, default: '' },
    stage: { type: String, default: '' },
    dayCurrent: { type: Number, default: 0 },
    dayTotal: { type: Number, default: 0 },
    percentComplete: { type: Number, default: 0 },
  },
  { _id: false }
);

const vitalsHistorySchema = new Schema({
  recordedAt: { type: Date, default: Date.now },
  recordedByName: { type: String, default: '' },
  date: { type: String, default: '' },
  bp: { type: String, default: '' },
  pulse: { type: String, default: '' },
  spo2: { type: String, default: '' },
  fasting: { type: String, default: '' },
  postMeal: { type: String, default: '' },
  random: { type: String, default: '' },
  weight: { type: String, default: '' },
});

const treatmentHistorySchema = new Schema({
  title: { type: String, required: true },
  doctor: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Completed'], default: 'Completed' },
  dateRange: { type: String, default: '' },
  description: { type: String, default: '' },
  medicines: [{ type: String }],
  appointmentCode: { type: String, default: '' },
  sortOrder: { type: Number, default: 0 },
});

const appointmentSchema = new Schema({
  appointmentCode: { type: String, default: '', trim: true },
  date: { type: String, required: true },
  time: { type: String, default: '' },
  type: { type: String, default: '' },
  doctor: { type: String, default: '' },
  status: { type: String, enum: ['Upcoming', 'Completed', 'Cancelled'], default: 'Completed' },
  followUpDate: { type: String, default: '' },
  followUpTime: { type: String, default: '' },
  feeType: { type: String, enum: ['Consultation', 'Medicine', ''], default: '' },
  sortOrder: { type: Number, default: 0 },
});

const labReportSchema = new Schema({
  testName: { type: String, required: true },
  date: { type: String, default: '' },
  result: { type: String, default: '' },
  status: { type: String, enum: ['Normal', 'Abnormal', 'Pending'], default: 'Normal' },
  lab: { type: String, default: 'Ayurveda Diagnostics' },
  sortOrder: { type: Number, default: 0 },
});

const invoiceSchema = new Schema({
  invoiceCode: { type: String, required: true },
  date: { type: String, default: '' },
  treatment: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  status: { type: String, enum: ['Paid', 'Pending', 'Overdue'], default: 'Paid' },
  sortOrder: { type: Number, default: 0 },
});

const documentSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, default: 'Document' },
  uploadedAt: { type: String, default: '' },
  size: { type: String, default: '' },
  url: { type: String, default: '' },
  sortOrder: { type: Number, default: 0 },
});

const patientCareProfileSchema = new Schema(
  {
    patientCode: { type: String, required: true, unique: true, index: true },
    patient: { type: Schema.Types.ObjectId, ref: 'HmsPatient' },
    vitals: { type: vitalsSchema, default: () => ({}) },
    vitalsHistory: { type: [vitalsHistorySchema], default: [] },
    activeTreatment: { type: activeTreatmentSchema, default: null },
    treatmentHistory: [treatmentHistorySchema],
    appointments: [appointmentSchema],
    labReports: [labReportSchema],
    invoices: [invoiceSchema],
    documents: [documentSchema],
  },
  { timestamps: true }
);

export default model('PatientCareProfile', patientCareProfileSchema);
