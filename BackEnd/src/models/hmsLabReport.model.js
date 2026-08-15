import { Schema, model } from 'mongoose';

const actorSchema = new Schema(
  {
    type: { type: String, enum: ['admin', 'staff', 'patient', 'system'], required: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    staffCode: { type: String, default: '' },
    patientCode: { type: String, default: '' },
    name: { type: String, default: '' },
  },
  { _id: false }
);

const hmsLabReportSchema = new Schema({
  reportCode: { type: String, unique: true, required: true, trim: true },
  patientCode: { type: String, required: true, index: true },
  patient: { type: Schema.Types.ObjectId, ref: 'HmsPatient', required: true },
  patientName: { type: String, required: true, trim: true },
  orderCode: { type: String, default: '', index: true },
  prescriptionCode: { type: String, default: '' },
  testCode: { type: String, default: '' },
  testName: { type: String, required: true, trim: true },
  categoryCode: { type: String, default: '' },
  categoryName: { type: String, default: '' },
  result: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Normal', 'Abnormal', 'Pending'],
    default: 'Pending',
  },
  labName: { type: String, default: 'In-house Lab' },
  reportDate: { type: Date, default: Date.now, index: true },
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  uploadedBy: { type: actorSchema, default: null },
  source: {
    type: String,
    enum: ['lab', 'patient', 'doctor'],
    default: 'lab',
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

hmsLabReportSchema.pre('save', function setUpdated(next) {
  this.updatedAt = new Date();
  next();
});

export default model('HmsLabReport', hmsLabReportSchema);
