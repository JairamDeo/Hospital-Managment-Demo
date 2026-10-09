import { Schema, model } from 'mongoose';

const clinicSettingsSchema = new Schema(
  {
    key: { type: String, unique: true, default: 'default' },
    name: { type: String, trim: true, default: 'Ayurveda Health' },
    patientCodePrefix: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'AH',
      maxlength: 8,
    },
  },
  { timestamps: true }
);

export default model('ClinicSettings', clinicSettingsSchema);
