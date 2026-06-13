import Joi from 'joi';

export const createRoomSchema = Joi.object({
  roomNumber: Joi.string().trim().min(1).max(20).required(),
  name: Joi.string().trim().min(1).max(120).required(),
  roomType: Joi.string().valid('IPD', 'Panchakarma').required(),
  capacity: Joi.number().integer().min(1).max(50).required(),
});

export const updateRoomSchema = Joi.object({
  roomNumber: Joi.string().trim().min(1).max(20).optional(),
  name: Joi.string().trim().min(1).max(120).optional(),
  roomType: Joi.string().valid('IPD', 'Panchakarma').optional(),
  capacity: Joi.number().integer().min(1).max(50).optional(),
  active: Joi.boolean().optional(),
}).min(1);
