import { Schema, model } from 'mongoose';

const pharmacyItemSchema = new Schema(
  {
    itemCode: { type: String, unique: true, required: true },
    name: { type: String, required: true, trim: true },
    company: { type: String, trim: true, default: '' },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'PharmacyCategoryMaster',
      required: true,
    },
    itemType: {
      type: String,
      enum: ['unit', 'strip', 'weight'],
      default: 'unit',
    },
    unitsPerPack: { type: Number, min: 0.01, default: 1 },
    spoonSizeGrams: { type: Number, min: 0.01 },
    stockInBaseUnits: { type: Boolean, default: false },
    packQuantity: { type: Number, required: true, min: 0 },
    unit: {
      type: Schema.Types.ObjectId,
      ref: 'PharmacyUnitMaster',
      required: true,
    },
    stock: { type: Number, required: true, min: 0, default: 0 },
    manufacturingDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    bestBeforeMonths: { type: Number, min: 1 },
    monthlyUsagePercent: { type: Number, min: 0, max: 100, default: 0 },
    salePrice: { type: Number, min: 0, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model('PharmacyItem', pharmacyItemSchema);
