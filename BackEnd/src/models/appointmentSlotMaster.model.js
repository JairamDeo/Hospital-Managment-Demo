import { Schema, model } from 'mongoose';

const appointmentSlotMasterSchema = new Schema(
  {
    time: { type: String, unique: true, required: true, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model('AppointmentSlotMaster', appointmentSlotMasterSchema);
