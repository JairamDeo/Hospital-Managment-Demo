import Joi from 'joi';

export const adminCreatePatientSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: Joi.string().email().allow('', null).optional(),
  mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).required(),
  whatsappNumber: Joi.string().pattern(/^[0-9]{10}$/).allow('', null).optional(),
  age: Joi.number().integer().min(1).max(120).required(),
  gender: Joi.string().valid('Male', 'Female').required(),
  bloodGroup: Joi.string().max(8).allow('', null).optional(),
  address: Joi.string().max(250).allow('', null).optional(),
  prakritiId: Joi.string().hex().length(24).allow('', null).empty('').optional(),
  treatmentId: Joi.string().hex().length(24).allow('', null).empty('').optional(),
  lastVisit: Joi.date().optional(),
  recordStatus: Joi.string().valid('Active', 'Pending', 'Inactive').optional(),
});

export const adminUpdatePatientSchema = Joi.object({
  name: Joi.string().min(2).max(80),
  email: Joi.string().email().allow('', null),
  mobileNumber: Joi.string().pattern(/^[0-9]{10}$/),
  whatsappNumber: Joi.string().pattern(/^[0-9]{10}$/).allow('', null),
  age: Joi.number().integer().min(1).max(120),
  gender: Joi.string().valid('Male', 'Female', 'Other', 'Not recorded'),
  bloodGroup: Joi.string().max(8).allow('', null),
  address: Joi.string().max(250).allow('', null),
  city: Joi.string().max(120).allow('', null),
  prakritiId: Joi.string().hex().length(24).allow('', null).empty(''),
  treatmentId: Joi.string().hex().length(24),
  lastVisit: Joi.date(),
  recordStatus: Joi.string().valid('Active', 'Pending', 'Inactive'),
}).min(1);

export const masterNameSchema = Joi.object({
  name: Joi.string().min(2).max(60).required(),
});

export const masterUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(60),
  active: Joi.boolean(),
}).min(1);

export const masterTimeSchema = Joi.object({
  time: Joi.string().min(2).max(60).required(),
  maxAppointments: Joi.number().integer().min(1).max(100).optional(),
});

export const masterTimeRangeSchema = Joi.object({
  startTime: Joi.string().min(2).max(60).required(),
  endTime: Joi.string().min(2).max(60).required(),
  gapMinutes: Joi.number().integer().min(5).max(240).required(),
  maxAppointments: Joi.number().integer().min(1).max(100).default(1),
});

export const masterTimeUpdateSchema = Joi.object({
  time: Joi.string().min(2).max(60),
  active: Joi.boolean(),
  maxAppointments: Joi.number().integer().min(1).max(100),
}).min(1);
