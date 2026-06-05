import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';

const STAFF_ROLES = ['Doctor', 'Therapist', 'Support'];
const DUTY_STATUSES = ['On Duty', 'Off Duty'];

const hmsStaffSchema = new Schema({
  staffCode: { type: String, unique: true, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: STAFF_ROLES, required: true },
  title: { type: String, trim: true, default: '' },
  dutyStatus: { type: String, enum: DUTY_STATUSES, default: 'On Duty' },
  statPrimaryValue: { type: Number, default: 0, min: 0 },
  statPrimaryLabel: { type: String, trim: true, default: 'Patients' },
  todayCount: { type: Number, default: 0, min: 0 },
  todayLabel: { type: String, trim: true, default: 'Today' },
  rating: { type: Number, default: 5, min: 0, max: 5 },
  tags: { type: [String], default: [] },
  shift: { type: String, trim: true, default: '9AM – 5PM' },
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
