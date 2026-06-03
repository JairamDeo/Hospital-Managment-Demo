import { Schema, model } from 'mongoose';

const patientPrescriptionSchema = new Schema(
  {
    patientCode: { type: String, required: true, index: true },
    patient: { type: Schema.Types.ObjectId, ref: 'HmsPatient' },
    title: { type: String, trim: true, default: '' },
    fileName: { type: String, required: true },
    mimeType: { type: String, default: 'application/pdf' },
    bytes: { type: Number, default: 0 },
    cloudinaryPublicId: { type: String, required: true },
    cloudinaryUrl: { type: String, required: true },
    cloudinaryFolder: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model('PatientPrescription', patientPrescriptionSchema);
