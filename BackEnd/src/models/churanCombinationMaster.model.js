import { Schema, model } from 'mongoose';

const powderSchema = new Schema(
  {
    itemCode: { type: String, default: '', trim: true },
    name: { type: String, required: true, trim: true },
    quantitySpoons: { type: Number, min: 0.01, default: 1 },
    spoonGrams: { type: Number, min: 0.01, default: 1.5 },
    quantityGrams: { type: Number, required: true, min: 0.01 },
  },
  { _id: false }
);

const churanCombinationMasterSchema = new Schema(
  {
    code: { type: String, unique: true, required: true },
    name: { type: String, required: true, trim: true },
    powders: { type: [powderSchema], default: [] },
    combination: { type: String, default: '', trim: true },
    howToIntake: { type: String, default: '', trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

churanCombinationMasterSchema.index({ name: 1 });

export default model('ChuranCombinationMaster', churanCombinationMasterSchema);
