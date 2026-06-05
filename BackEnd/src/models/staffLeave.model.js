import { Schema, model } from 'mongoose';

const LEAVE_TYPES = ['Casual', 'Sick'];
const LEAVE_STATUSES = ['Pending', 'Approved', 'Rejected'];

const staffLeaveSchema = new Schema({
  leaveCode: { type: String, unique: true, required: true, trim: true },
  staffCode: { type: String, required: true, index: true, trim: true },
  staffName: { type: String, trim: true, default: '' },
  leaveType: { type: String, enum: LEAVE_TYPES, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  leaveDates: { type: [String], default: [] },
  totalDays: { type: Number, required: true, min: 1 },
  status: { type: String, enum: LEAVE_STATUSES, default: 'Pending' },
  appliedBy: {
    type: { type: String, enum: ['admin', 'staff'], default: 'staff' },
    name: { type: String, default: '' },
    staffCode: { type: String },
  },
  reviewedBy: {
    type: { type: String, enum: ['admin'], default: 'admin' },
    name: { type: String, default: '' },
    adminId: { type: Schema.Types.ObjectId },
  },
  reviewedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default model('StaffLeave', staffLeaveSchema);
