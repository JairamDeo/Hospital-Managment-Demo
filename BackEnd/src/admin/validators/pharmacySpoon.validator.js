import Joi from 'joi';

export const createPharmacySpoonSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  grams: Joi.number().positive().required(),
});

export const updatePharmacySpoonSchema = Joi.object({
  name: Joi.string().min(2).max(80).optional(),
  grams: Joi.number().positive().optional(),
  active: Joi.boolean().optional(),
});
