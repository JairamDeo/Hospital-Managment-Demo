import PharmacySpoonMaster from '../models/pharmacySpoonMaster.model.js';

export const getDefaultPharmacySpoonGrams = async () => {
  const preferred = await PharmacySpoonMaster.findOne({ active: true, isDefault: true }).lean();
  if (preferred?.grams > 0) return preferred.grams;

  const first = await PharmacySpoonMaster.findOne({ active: true }).sort({ grams: 1 }).lean();
  return first?.grams > 0 ? first.grams : 1;
};

export const resolveSpoonGrams = (item, defaultGrams = 1) => {
  const own = Number(item?.spoonSizeGrams);
  if (Number.isFinite(own) && own > 0) return own;
  const fallback = Number(defaultGrams);
  return Number.isFinite(fallback) && fallback > 0 ? fallback : 1;
};
