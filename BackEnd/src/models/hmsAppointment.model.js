import { Schema, model } from 'mongoose';

const createdBySchema = new Schema(
  {
    type: { type: String, enum: ['admin', 'patient', 'staff'], required: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    staffCode: { type: String, default: '' },
    patientCode: { type: String, default: '' },
    name: { type: String, default: '' },
  },
  { _id: false }
);

const actorSchema = new Schema(
  {
    type: { type: String, enum: ['admin', 'staff'], required: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    staffCode: { type: String, default: '' },
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
  attendedAt: { type: Date, default: null },
  attendedBy: { type: actorSchema, default: null },
  followUpDate: { type: Date, default: null },
  followUpTimeSlot: { type: String, trim: true, default: '' },
  followUpTimeDisplay: { type: String, trim: true, default: '' },
  followUpNotes: { type: String, trim: true, default: '' },
  followUpAddedBy: { type: actorSchema, default: null },
  followUpAddedAt: { type: Date, default: null },
  appointmentReminderSentAt: { type: Date, default: null },
  followUpReminderSentAt: { type: Date, default: null },
  visitNotes: { type: String, trim: true, default: '' },
  consultationFeeCharged: { type: Number, min: 0, default: null },
  consultationFeeExpected: { type: Number, min: 0, default: null },
  consultationInvoiceCode: { type: String, default: '', trim: true, index: true },
  paymentStatus: {
    type: String,
    enum: ['not_required', 'unpaid', 'paid'],
    default: 'not_required',
    index: true,
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
