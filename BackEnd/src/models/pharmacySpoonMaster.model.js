import { Schema, model } from 'mongoose';

const pharmacySpoonMasterSchema = new Schema(
  {
    code: { type: String, unique: true, required: true },
    name: { type: String, required: true, trim: true },
    grams: { type: Number, required: true, min: 0.01 },
    isDefault: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model('PharmacySpoonMaster', pharmacySpoonMasterSchema);
