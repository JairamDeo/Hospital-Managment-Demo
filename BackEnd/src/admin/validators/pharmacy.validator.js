import Joi from 'joi';

const itemType = Joi.string().valid('unit', 'strip', 'weight').default('unit');

export const createPharmacyItemSchema = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  company: Joi.string().max(120).allow('', null).optional(),
  categoryId: Joi.string().hex().length(24).required(),
  itemType,
  unitsPerPack: Joi.number().positive().optional(),
  spoonSizeGrams: Joi.number().positive().optional(),
  packQuantity: Joi.number().positive().optional(),
  unitId: Joi.string().hex().length(24).required(),
  stock: Joi.number().min(0).required(),
  salePrice: Joi.number().min(0).required(),
  manufacturingDate: Joi.alternatives().try(Joi.date(), Joi.string().min(8)).required(),
  expiryDate: Joi.alternatives().try(Joi.date(), Joi.string().min(8)).required(),
  bestBeforeMonths: Joi.number().integer().min(1).allow(null).optional(),
});
