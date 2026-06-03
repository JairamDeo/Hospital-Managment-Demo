import { Schema, model } from 'mongoose';

const customerSchema = new Schema({
  customerCode: { type: String, unique: true, required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobileNumber: { type: String, required: true, unique: true },
  age: { type: Number, min: 1, max: 120 },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  prakriti: { type: String, enum: ['Vata', 'Pitta', 'Kapha'], default: null },
  status: { type: Boolean, default: true },
  otp: { type: String },
  otpExpiresAt: { type: Date },
  lastOtpSentAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default model('Customer', customerSchema);
