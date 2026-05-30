import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';

const usersSchema = new Schema({
  userCode: { type: String, unique: true, required: true },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  name: { type: String },
  dob: { type: Date },
  age: { type: Number },
  city: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  mobileNumber: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  address: { type: String },
  password: { type: String },
  role: {
    type: String,
    enum: ['admin', 'doctor', 'nurse', 'receptionist', 'lab_technician', 'pharmacist'],
    required: true,
  },
  status: { type: Boolean, default: true },
  otp: { type: String },
  otpExpiresAt: { type: Date },
  lastOtpSentAt: { type: Date },
  resetToken: { type: String },
  resetTokenExpiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

usersSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

usersSchema.methods.comparePassword = async function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

usersSchema.virtual('fullName').get(function fullName() {
  if (this.firstName || this.lastName) {
    return [this.firstName, this.lastName].filter(Boolean).join(' ');
  }
  return this.name || '';
});

usersSchema.set('toJSON', { virtuals: true });

export default model('Users', usersSchema);
