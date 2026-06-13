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
  roomCode: { type: String, required: true, index: true },
  room: { type: String, required: true, trim: true },
  startDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['Starting', 'Ongoing', 'Complete', 'Cancelled'],
    default: 'Starting',
  },
  treatmentName: { type: String, trim: true, default: '' },
  totalFees: { type: Number, min: 0, default: 0 },
  amountPaid: { type: Number, min: 0, default: 0 },
  appointmentCode: { type: String, default: '', index: true },
  dailySessions: {
    type: [
      new Schema(
        {
          dayNumber: { type: Number, required: true, min: 1 },
          sessionDate: { type: Date, default: null },
          time: { type: String, default: '' },
          duration: { type: String, default: '' },
          panchakarmaType: { type: String, default: '' },
          medicineContent: { type: String, default: '' },
        },
        { _id: true }
      ),
    ],
    default: [],
  },
  createdBy: { type: createdBySchema, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

hmsPanchakarmaProgramSchema.pre('save', function setUpdated(next) {
  this.updatedAt = new Date();
  next();
});

export default model('HmsPanchakarmaProgram', hmsPanchakarmaProgramSchema);
