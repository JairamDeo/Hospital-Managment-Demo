import Joi from 'joi';

export const createLabTestSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  categoryId: Joi.string().hex().length(24).required(),
});

export const updateLabTestSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).optional(),
  categoryId: Joi.string().hex().length(24).optional(),
  active: Joi.boolean().optional(),
}).min(1);
