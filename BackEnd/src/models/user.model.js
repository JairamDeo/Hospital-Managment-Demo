import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';

const usersSchema = new Schema({
  userCode: { type: String, unique: true, required: true },    
  name: { type: String,  },
  dob: { type: Date},
  age: { type: Number },
  city: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  mobileNumber: { type: String, required: true },
  email:{ type: String },
  address: { type: String },
  password: { type: String},   
  role: { type: String, enum: ['admin', 'doctor', 'nurse', 'receptionist', 'lab_technician','pharmacist'], required: true },
  status: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Add method to compare passwords
usersSchema.methods.comparePassword = async function (password) {
  
  return bcrypt.compare(password, this.password);
};

export default model('Users', usersSchema);