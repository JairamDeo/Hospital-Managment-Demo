import { Schema, model } from 'mongoose';

const actorSchema = new Schema(
  {
    type: { type: String, enum: ['admin', 'staff'], required: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    staffCode: { type: String, default: '' },
    name: { type: String, default: '' },
  },
  { _id: false }
);

const hmsRazorpayPaymentSchema = new Schema({
  invoiceCode: { type: String, required: true, index: true },
  appointmentCode: { type: String, default: '', index: true },
  razorpayOrderId: { type: String },
  razorpayQrCodeId: { type: String },
  razorpayPaymentLinkId: { type: String },
  razorpayPaymentId: { type: String, index: true },
  collectionType: { type: String, enum: ['checkout', 'qr', 'payment_link'], default: 'qr' },
  qrImageUrl: { type: String, default: '' },
  qrShortUrl: { type: String, default: '' },
  paymentLinkUrl: { type: String, default: '' },
  patientMobile: { type: String, default: '' },
  smsSentAt: { type: Date, default: null },
  failureReason: { type: String, default: '' },
  patientCode: { type: String, default: '' },
  patientName: { type: String, default: '' },
  feeType: { type: String, default: '' },
  doctorName: { type: String, default: '' },
  invoiceDescription: { type: String, default: '' },
  amountPaise: { type: Number, required: true, min: 100 },
  amount: { type: Number, required: true, min: 0.01 },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created', index: true },
  paymentMethod: { type: String, default: '' },
  initiatedBy: { type: actorSchema, default: null },
  paidAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

hmsRazorpayPaymentSchema.pre('save', function setUpdated(next) {
  this.updatedAt = new Date();
  next();
});

// Sparse: each flow omits unrelated Razorpay ids.
hmsRazorpayPaymentSchema.index({ razorpayOrderId: 1 }, { unique: true, sparse: true });
hmsRazorpayPaymentSchema.index({ razorpayQrCodeId: 1 }, { unique: true, sparse: true });
hmsRazorpayPaymentSchema.index({ razorpayPaymentLinkId: 1 }, { unique: true, sparse: true });

export default model('HmsRazorpayPayment', hmsRazorpayPaymentSchema);
