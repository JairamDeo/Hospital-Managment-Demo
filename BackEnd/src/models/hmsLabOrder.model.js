import { Schema, model } from 'mongoose';

const recommendedTestSchema = new Schema(
  {
    testCode: { type: String, required: true, trim: true },
    testName: { type: String, required: true, trim: true },
    categoryCode: { type: String, default: '' },
    categoryName: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    reportCode: { type: String, default: '' },
  },
  { _id: true }
);

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

const hmsLabOrderSchema = new Schema({
  orderCode: { type: String, unique: true, required: true, trim: true },
  patientCode: { type: String, required: true, index: true },
  patient: { type: Schema.Types.ObjectId, ref: 'HmsPatient', required: true },
  patientName: { type: String, required: true, trim: true },
  prescriptionCode: { type: String, default: '', index: true },
  appointmentCode: { type: String, default: '', index: true },
  doctorStaffCode: { type: String, default: '' },
  doctorName: { type: String, default: '' },
  tests: { type: [recommendedTestSchema], default: [] },
  status: {
    type: String,
    enum: ['Pending', 'Partial', 'Completed', 'Cancelled'],
    default: 'Pending',
    index: true,
  },
  notes: { type: String, default: '' },
  createdBy: { type: actorSchema, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

hmsLabOrderSchema.pre('save', function setUpdated(next) {
  this.updatedAt = new Date();
  next();
});

export default model('HmsLabOrder', hmsLabOrderSchema);
