import Joi from 'joi';

export const customerRegisterSchema = Joi.object({
  name: Joi.string().min(2).max(80).required().messages({
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required',
  }),
  mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    'string.pattern.base': 'Mobile number must be a 10-digit number',
    'any.required': 'Mobile number is required',
  }),
  age: Joi.number().integer().min(1).max(120).required().messages({
    'any.required': 'Age is required',
  }),
  gender: Joi.string().valid('Male', 'Female', 'Other').required().messages({
    'any.only': 'Please select a valid gender',
    'any.required': 'Gender is required',
  }),
});

export const customerMobileSchema = Joi.object({
  mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    'string.pattern.base': 'Mobile number must be a 10-digit number',
    'any.required': 'Mobile number is required',
  }),
});

export const customerVerifyOtpSchema = Joi.object({
  mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).required(),
  otp: Joi.string().length(4).pattern(/^[0-9]{4}$/).required().messages({
    'string.length': 'OTP must be 4 digits',
    'string.pattern.base': 'OTP must contain only numbers',
  }),
});

export const customerUpdateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(80),
  email: Joi.string().email(),
  age: Joi.number().integer().min(1).max(120),
  gender: Joi.string().valid('Male', 'Female', 'Other'),
  prakriti: Joi.string().valid('Vata', 'Pitta', 'Kapha').allow(null, ''),
})
  .min(1)
  .messages({
    'object.min': 'At least one field is required to update',
  });
