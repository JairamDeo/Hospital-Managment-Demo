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

const hmsPanchakarmaProgramSchema = new Schema({
  programCode: { type: String, unique: true, required: true, trim: true },
  patientCode: { type: String, required: true, index: true },
  patient: { type: Schema.Types.ObjectId, ref: 'HmsPatient', required: true },
  patientName: { type: String, required: true, trim: true },
  staffCode: { type: String, required: true, index: true },
  staff: { type: Schema.Types.ObjectId, ref: 'HmsStaff', required: true },
  therapistName: { type: String, required: true, trim: true },
  therapy: {
    type: String,
    enum: ['Vamana', 'Virechana', 'Basti', 'Nasya'],
    required: true,
  },
  totalDays: { type: Number, required: true, min: 1 },
  currentDay: { type: Number, default: 1, min: 1 },
  room: {
    type: String,
    enum: ['Room 1', 'Room 2', 'Room 3', 'Room 4'],
    required: true,
  },
  startDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['Starting', 'Ongoing', 'Complete', 'Cancelled'],
    default: 'Starting',
  },
  createdBy: { type: createdBySchema, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

hmsPanchakarmaProgramSchema.index(
  { room: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['Starting', 'Ongoing'] } },
  }
);

hmsPanchakarmaProgramSchema.pre('save', function setUpdated(next) {
  this.updatedAt = new Date();
  next();
});

export default model('HmsPanchakarmaProgram', hmsPanchakarmaProgramSchema);
