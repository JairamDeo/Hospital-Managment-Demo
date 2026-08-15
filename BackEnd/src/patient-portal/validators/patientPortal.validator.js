import Joi from 'joi';

export const patientRegisterSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: Joi.string().email().allow('', null).optional(),
  mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).required(),
  age: Joi.number().integer().min(1).max(120).required(),
  gender: Joi.string().valid('Male', 'Female', 'Other').required(),
  prakritiId: Joi.string().hex().length(24).allow(null, '').optional(),
  treatmentId: Joi.string().hex().length(24).allow(null, '').optional(),
});

export const patientMobileSchema = Joi.object({
  mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).required(),
});

export const patientVerifyOtpSchema = Joi.object({
  mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).required(),
  otp: Joi.string().length(4).pattern(/^[0-9]{4}$/).required(),
});

export const patientUpdateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(80),
  email: Joi.string().email().allow('', null),
  age: Joi.number().integer().min(1).max(120),
  gender: Joi.string().valid('Male', 'Female', 'Other'),
  prakritiId: Joi.string().hex().length(24).allow(null, ''),
  treatmentId: Joi.string().hex().length(24).allow(null, ''),
}).min(1);

export const patientVerifyAppointmentPaymentSchema = Joi.object({
  appointmentCode: Joi.string().required(),
  razorpayOrderId: Joi.string().required(),
  razorpayPaymentId: Joi.string().required(),
  razorpaySignature: Joi.string().required(),
  razorpayMethod: Joi.string().allow('', null).optional(),
});
