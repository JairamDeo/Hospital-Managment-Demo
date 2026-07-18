import { Schema, model } from 'mongoose';

const hmsNotificationSchema = new Schema({
  audience: {
    type: String,
    enum: ['lab', 'doctor', 'staff', 'admin', 'patient'],
    required: true,
    index: true,
  },
  staffCode: { type: String, default: '', index: true },
  patientCode: { type: String, default: '', index: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  href: { type: String, default: '' },
  type: {
    type: String,
    enum: ['lab_order', 'lab_report', 'info'],
    default: 'info',
  },
  meta: { type: Schema.Types.Mixed, default: {} },
  readAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

hmsNotificationSchema.index({ audience: 1, createdAt: -1 });

export default model('HmsNotification', hmsNotificationSchema);
