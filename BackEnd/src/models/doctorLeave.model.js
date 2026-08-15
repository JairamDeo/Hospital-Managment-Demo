import { Schema, model } from 'mongoose';

const doctorLeaveSchema = new Schema({
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    Date: { type: Date, required: true },
    leaveType: { type: String, enum: ['sick', 'vacation', 'conference', 'other'], required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['approved', 'pending', 'rejected'], default: 'pending' },
    unavailableSlots: [{
    type: Schema.Types.ObjectId,
    ref: 'DoctorAvailability', // Assuming this references the DoctorAvailability model
  }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
export default model('DoctorLeave', doctorLeaveSchema);  