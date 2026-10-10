import Joi from 'joi';

const powderSchema = Joi.object({
  itemCode: Joi.string().trim().allow('').optional(),
  name: Joi.string().trim().min(1).max(200).required(),
  quantitySpoons: Joi.number().positive().optional(),
  spoonGrams: Joi.number().positive().optional(),
  quantityGrams: Joi.number().positive().required(),
});

export const createChuranCombinationSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  powders: Joi.array().items(powderSchema).min(1).required(),
  combination: Joi.string().trim().max(2000).allow('', null).optional(),
  howToIntake: Joi.string().trim().max(500).allow('', null).optional(),
});

export const updateChuranCombinationSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).optional(),
  powders: Joi.array().items(powderSchema).min(1).optional(),
  combination: Joi.string().trim().max(2000).allow('', null).optional(),
  howToIntake: Joi.string().trim().max(500).allow('', null).optional(),
  active: Joi.boolean().optional(),
}).min(1);
