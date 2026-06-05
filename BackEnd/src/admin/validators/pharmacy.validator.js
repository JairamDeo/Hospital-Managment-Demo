import Joi from 'joi';

export const createPharmacyItemSchema = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  company: Joi.string().max(120).allow('', null).optional(),
  categoryId: Joi.string().hex().length(24).required(),
  packQuantity: Joi.number().positive().required(),
  unitId: Joi.string().hex().length(24).required(),
  stock: Joi.number().integer().min(0).required(),
  salePrice: Joi.number().min(0).required(),
  manufacturingDate: Joi.alternatives().try(Joi.date(), Joi.string().min(8)).required(),
  expiryDate: Joi.alternatives().try(Joi.date(), Joi.string()).allow('', null).optional(),
  bestBeforeMonths: Joi.number().integer().min(1).allow(null).optional(),
});
