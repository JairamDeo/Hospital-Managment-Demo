import { Schema, model } from 'mongoose';
import { clinicalProfileSchema } from './hmsPatientClinical.schema.js';

const hmsPatientSchema = new Schema({
  patientCode: { type: String, unique: true, required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
  mobileNumber: { type: String, required: true, unique: true, trim: true },
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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

hmsPatientSchema.pre('save', function setUpdated(next) {
  this.updatedAt = new Date();
  next();
});

export default model('HmsPatient', hmsPatientSchema);
