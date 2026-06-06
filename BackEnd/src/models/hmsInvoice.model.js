import { Schema, model } from 'mongoose';

const lineItemSchema = new Schema(
  {
    itemCode: { type: String, default: '' },
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0, default: 0 },
    amount: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: true }
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

const hmsInvoiceSchema = new Schema({
  invoiceCode: { type: String, unique: true, required: true, trim: true },
  patientCode: { type: String, required: true, index: true },
  patient: { type: Schema.Types.ObjectId, ref: 'HmsPatient', required: true },
  patientName: { type: String, required: true, trim: true },
  feeType: { type: String, enum: ['Consultation', 'Medicine', 'Panchakarma'], required: true },
  visitType: {
    type: String,
    enum: ['Appointment', 'Follow-up', ''],
    default: '',
  },
  appointmentCode: { type: String, default: '', index: true },
  programCode: { type: String, default: '', index: true },
  doctorName: { type: String, default: '' },
  description: { type: String, trim: true, default: '' },
  lineItems: { type: [lineItemSchema], default: [] },
  amount: { type: Number, required: true, min: 0 },
  amountPaid: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['Pending', 'Partial', 'Paid'], default: 'Pending' },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Card', 'Net Banking', ''],
    default: '',
  },
  paidAt: { type: Date, default: null },
  collectedBy: { type: actorSchema, default: null },
  createdBy: { type: actorSchema, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

hmsInvoiceSchema.index({ feeType: 1, status: 1, createdAt: -1 });

hmsInvoiceSchema.pre('save', function setUpdated(next) {
  this.updatedAt = new Date();
  next();
});

export default model('HmsInvoice', hmsInvoiceSchema);
