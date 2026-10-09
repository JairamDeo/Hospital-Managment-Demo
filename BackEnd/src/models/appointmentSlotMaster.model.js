import { Schema, model } from 'mongoose';

const appointmentSlotMasterSchema = new Schema(
  {
    /** Slot window start, e.g. "09:00 AM" */
    time: { type: String, unique: true, required: true, trim: true },
    /** Slot window end, e.g. "09:30 AM" */
    endTime: { type: String, trim: true, default: '' },
    /** Max bookings allowed for this slot per doctor per day */
    maxAppointments: { type: Number, default: 1, min: 1, max: 100 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model('AppointmentSlotMaster', appointmentSlotMasterSchema);
