import { Schema, model } from 'mongoose';

const labTestMasterSchema = new Schema(
  {
    code: { type: String, unique: true, required: true },
    name: { type: String, required: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'LabTestCategoryMaster', required: true },
    categoryCode: { type: String, default: '', index: true },
    categoryName: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

labTestMasterSchema.index({ category: 1, name: 1 });

export default model('LabTestMaster', labTestMasterSchema);
