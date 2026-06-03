import { Schema, model } from 'mongoose';

const pharmacyUnitMasterSchema = new Schema(
  {
    code: { type: String, unique: true, required: true },
    name: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model('PharmacyUnitMaster', pharmacyUnitMasterSchema);
