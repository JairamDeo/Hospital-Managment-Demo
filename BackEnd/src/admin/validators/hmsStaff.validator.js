import Joi from 'joi';

const staffRole = Joi.string().valid('Doctor', 'Therapist', 'Pharmacist', 'Support');
const dutyStatus = Joi.string().valid('On Duty', 'Off Duty');

export const adminCreateStaffSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  role: staffRole.required(),
  title: Joi.string().min(2).max(120).required(),
  shift: Joi.string().max(40).allow('', null).optional(),
  tags: Joi.array().items(Joi.string().trim().max(40)).max(8).optional(),
});

export const adminUpdateStaffSchema = Joi.object({
  name: Joi.string().min(2).max(80),
  role: staffRole,
  title: Joi.string().min(2).max(120),
  dutyStatus,
  shift: Joi.string().max(40).allow('', null),
  tags: Joi.array().items(Joi.string().trim().max(40)).max(8),
  rating: Joi.number().min(0).max(5),
  statPrimaryValue: Joi.number().integer().min(0),
  todayCount: Joi.number().integer().min(0),
}).min(1);
