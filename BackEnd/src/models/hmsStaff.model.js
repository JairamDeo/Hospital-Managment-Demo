import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';

const STAFF_ROLES = ['Doctor', 'Therapist', 'Support', 'Lab'];
const DUTY_STATUSES = ['On Duty', 'Off Duty'];
const QUALIFICATION_LEVELS = ['UG', 'PG', 'Doctorate', 'Diploma', 'Certificate', 'Other'];

const qualificationSchema = new Schema(
  {
    level: { type: String, enum: QUALIFICATION_LEVELS, required: true },
    degree: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const staffCompensationSchema = new Schema(
  {
    basicSalary: { type: Number, min: 0, default: 0 },
    hra: { type: Number, min: 0, default: 0 },
    dearnessAllowance: { type: Number, min: 0, default: 0 },
    specialAllowance: { type: Number, min: 0, default: 0 },
    transportAllowance: { type: Number, min: 0, default: 0 },
    medicalAllowance: { type: Number, min: 0, default: 0 },
    otherAllowances: { type: Number, min: 0, default: 0 },
    pfDeduction: { type: Number, min: 0, default: 0 },
    professionalTax: { type: Number, min: 0, default: 0 },
    otherDeductions: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const hmsStaffSchema = new Schema({
  staffCode: { type: String, unique: true, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: STAFF_ROLES, required: true },
  title: { type: String, trim: true, default: '' },
  qualifications: { type: [qualificationSchema], default: [] },
  registrationNumber: { type: String, trim: true, default: '' },
  aadharNumber: { type: String, trim: true, default: '' },
  panNumber: { type: String, trim: true, default: '' },
  dutyStatus: { type: String, enum: DUTY_STATUSES, default: 'On Duty' },
  statPrimaryValue: { type: Number, default: 0, min: 0 },
  statPrimaryLabel: { type: String, trim: true, default: 'Patients' },
  todayCount: { type: Number, default: 0, min: 0 },
  todayLabel: { type: String, trim: true, default: 'Today' },
  rating: { type: Number, default: 5, min: 0, max: 5 },
  tags: { type: [String], default: [] },
  shift: { type: String, trim: true, default: '9AM – 5PM' },
  consultationFee: { type: Number, min: 0, default: 0 },
  compensation: { type: staffCompensationSchema, default: () => ({}) },
  /** @deprecated use compensation.basicSalary */
  basicSalary: { type: Number, min: 0, default: 0 },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  password: { type: String },
  status: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const isBcryptHash = (value) =>
  typeof value === 'string' && /^\$2[aby]?\$\d{2}\$/.test(value);

hmsStaffSchema.pre('save', async function setUpdated(next) {
  this.updatedAt = new Date();
  if (this.isModified('password') && this.password && !isBcryptHash(this.password)) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

hmsStaffSchema.methods.comparePassword = async function comparePassword(password) {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

export default model('HmsStaff', hmsStaffSchema);
