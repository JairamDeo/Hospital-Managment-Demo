import { Schema , model } from 'mongoose';

const patientAppointmentSchema = new Schema({
  appointmentCode: { type: String, unique: true, required: true }, // Unique code for the appointment
      
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },

  date: { type: Date, required: true }, // Only the date part (use startOfDay)
  slot: { type: String, required: true }, // e.g., "10-2"

  reason: { type: String, required: true }, // Reason for visit

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
    default: 'pending'
  },

  appointmentType: {
    type: String,
    enum: ['offline', 'online',],
    default: 'offline'
  },

  paymentStatus: {
    type: String,
    enum: ['not-paid', 'paid', 'refunded'],
    default: 'not-paid'
  },

  notes: { type: String },

  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }, // Admin/staff/self who created
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default model('PatientAppointment', patientAppointmentSchema);
