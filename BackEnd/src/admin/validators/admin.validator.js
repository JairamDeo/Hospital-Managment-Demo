import Joi from 'joi';

export const adminLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(8).max(64).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'any.required': 'Password is required',
  }),
});

export const forgotPasswordMobileSchema = Joi.object({
  mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    'string.pattern.base': 'Mobile number must be a 10-digit number',
    'any.required': 'Mobile number is required',
  }),
});

export const verifyOtpSchema = Joi.object({
  mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).required(),
  otp: Joi.string().length(4).pattern(/^[0-9]{4}$/).required().messages({
    'string.length': 'OTP must be 4 digits',
    'string.pattern.base': 'OTP must contain only numbers',
  }),
});

export const resetPasswordSchema = Joi.object({
  resetToken: Joi.string().required(),
  newPassword: Joi.string().min(8).max(64).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
  }),
});
