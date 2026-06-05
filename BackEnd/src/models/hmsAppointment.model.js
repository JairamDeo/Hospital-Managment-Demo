import { Schema, model } from 'mongoose';

const createdBySchema = new Schema(
  {
    type: { type: String, enum: ['admin', 'patient'], required: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    patientCode: { type: String, default: '' },
    name: { type: String, default: '' },
  },
  { _id: false }
);

const hmsAppointmentSchema = new Schema({
  appointmentCode: { type: String, unique: true, required: true, trim: true },
  patientCode: { type: String, required: true, index: true },
  patient: { type: Schema.Types.ObjectId, ref: 'HmsPatient', required: true },
  patientName: { type: String, required: true, trim: true },
  staffCode: { type: String, required: true, index: true },
  staff: { type: Schema.Types.ObjectId, ref: 'HmsStaff', required: true },
  doctorName: { type: String, required: true, trim: true },
  appointmentDate: { type: Date, required: true },
  timeSlot: { type: String, required: true, trim: true },
  timeDisplay: { type: String, required: true, trim: true },
  appointmentType: {
    type: String,
    enum: ['General Consult', 'Panchakarma', 'Follow-up', 'Diet Consult', 'Shodhana'],
    required: true,
  },
  notes: { type: String, trim: true, default: '' },
  status: {
    type: String,
    enum: ['Upcoming', 'Completed', 'Cancelled'],
    default: 'Upcoming',
  },
  createdBy: { type: createdBySchema, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

hmsAppointmentSchema.index(
  { staffCode: 1, appointmentDate: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $ne: 'Cancelled' } },
  }
);

hmsAppointmentSchema.pre('save', function setUpdated(next) {
  this.updatedAt = new Date();
  next();
});

export default model('HmsAppointment', hmsAppointmentSchema);
