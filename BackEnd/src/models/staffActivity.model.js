import { Schema, model } from 'mongoose';

const ACTIVITY_TYPES = [
  'check_in',
  'check_out',
  'leave_applied',
  'leave_approved',
  'leave_rejected',
];

const staffActivitySchema = new Schema({
  staffCode: { type: String, required: true, index: true, trim: true },
  activityType: { type: String, enum: ACTIVITY_TYPES, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  tags: { type: [String], default: [] },
  meta: { type: Schema.Types.Mixed, default: {} },
  performedBy: {
    type: { type: String, enum: ['admin', 'staff'], default: 'staff' },
    name: { type: String, default: '' },
    adminId: { type: Schema.Types.ObjectId },
    staffCode: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
});

export default model('StaffActivity', staffActivitySchema);
