import { Schema, model } from 'mongoose';

const caseNoteSchema = new Schema(
  {
    noteDate: { type: Date, default: Date.now },
    treatmentGiven: { type: String, default: '', trim: true },
    medicines: { type: String, default: '', trim: true },
    observations: { type: String, default: '', trim: true },
    bp: { type: String, default: '', trim: true },
    pulse: { type: String, default: '', trim: true },
    spo2: { type: String, default: '', trim: true },
    recordedBy: {
      type: { type: String, enum: ['admin', 'staff'], default: 'admin' },
      staffCode: { type: String, default: '' },
      name: { type: String, default: '' },
    },
  },
  { _id: true }
);

const dischargeSummarySchema = new Schema(
  {
    diagnosis: { type: String, default: '', trim: true },
    treatmentSummary: { type: String, default: '', trim: true },
    medicinesAtDischarge: { type: String, default: '', trim: true },
    advice: { type: String, default: '', trim: true },
    followUpDate: { type: Date, default: null },
    dischargedBy: {
      type: { type: String, enum: ['admin', 'staff'], default: 'admin' },
      staffCode: { type: String, default: '' },
      name: { type: String, default: '' },
    },
  },
  { _id: false }
);

const hmsIpdAdmissionSchema = new Schema(
  {
    admissionCode: { type: String, unique: true, required: true, trim: true },
    patientCode: { type: String, required: true, index: true },
    patient: { type: Schema.Types.ObjectId, ref: 'HmsPatient', required: true },
    patientName: { type: String, required: true, trim: true },
    roomCode: { type: String, required: true, index: true },
    room: { type: Schema.Types.ObjectId, ref: 'RoomMaster', required: true },
    roomName: { type: String, required: true, trim: true },
    roomNumber: { type: String, required: true, trim: true },
    staffCode: { type: String, required: true, index: true },
    staff: { type: Schema.Types.ObjectId, ref: 'HmsStaff', required: true },
    doctorName: { type: String, required: true, trim: true },
    admittedAt: { type: Date, required: true },
    expectedDischargeAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['Admitted', 'Discharged'],
      default: 'Admitted',
      index: true,
    },
    dischargedAt: { type: Date, default: null },
    diagnosis: { type: String, default: '', trim: true },
    chiefComplaint: { type: String, default: '', trim: true },
    caseNotes: { type: [caseNoteSchema], default: [] },
    dischargeSummary: { type: dischargeSummarySchema, default: null },
  },
  { timestamps: true }
);

hmsIpdAdmissionSchema.index({ status: 1, admittedAt: -1 });

export default model('HmsIpdAdmission', hmsIpdAdmissionSchema);
