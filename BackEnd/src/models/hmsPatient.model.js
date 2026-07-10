import { Schema, model } from 'mongoose';
import { clinicalProfileSchema } from './hmsPatientClinical.schema.js';

const insuranceDependentSchema = new Schema(
  {
    name: { type: String, trim: true, default: '' },
    relation: { type: String, trim: true, default: '' },
    age: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const patientHealthInsuranceSchema = new Schema(
  {
    providerName: { type: String, trim: true, default: '' },
    policyNumber: { type: String, trim: true, default: '' },
    policyType: {
      type: String,
      enum: ['Individual', 'Family', 'Group'],
      default: 'Individual',
    },
    sumInsured: { type: Number, min: 0, default: 0 },
    annualPremium: { type: Number, min: 0, default: 0 },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    tpaName: { type: String, trim: true, default: '' },
    cardNumber: { type: String, trim: true, default: '' },
    dependents: { type: [insuranceDependentSchema], default: [] },
    notes: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['Active', 'Expired', 'Pending', 'Cancelled'],
      default: 'Pending',
    },
  },
  { _id: false }
);

const hmsPatientSchema = new Schema({
  patientCode: { type: String, unique: true, required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
  mobileNumber: { type: String, required: true, unique: true, trim: true },
  whatsappNumber: { type: String, trim: true, default: '' },
  age: { type: Number, min: 1, max: 120 },
  gender: { type: String, enum: ['Male', 'Female', 'Other', 'Not recorded'], default: 'Not recorded' },
  bloodGroup: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: 'India' },
  prakriti: { type: Schema.Types.ObjectId, ref: 'PrakritiMaster', default: null },
  treatment: { type: Schema.Types.ObjectId, ref: 'TreatmentMaster', default: null },
  lastVisit: { type: Date, default: Date.now },
  recordStatus: {
    type: String,
    enum: ['Active', 'Pending', 'Inactive'],
    default: 'Active',
  },
  createdByAdmin: { type: Boolean, default: false },
  status: { type: Boolean, default: true },
  otp: { type: String },
  otpExpiresAt: { type: Date },
  lastOtpSentAt: { type: Date },
  clinicalProfile: { type: clinicalProfileSchema, default: () => ({}) },
  healthInsurance: { type: patientHealthInsuranceSchema, default: () => ({}) },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

hmsPatientSchema.pre('save', function setUpdated(next) {
  this.updatedAt = new Date();
  next();
});

export default model('HmsPatient', hmsPatientSchema);
