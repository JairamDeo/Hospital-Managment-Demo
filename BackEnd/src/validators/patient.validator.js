
import Joi from 'joi';  

// Validation schema for patient registration
export const patientRegistrationSchema = Joi.object({

  mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).required().messages({'string.pattern.base': 'Mobile number must be exactly 10 digits.'}),
  
});

// Validation schema for patient registration
export const patientUpdateSchema = Joi.object({
  name: Joi.string().required(),
  dob: Joi.date().required(),
  gender: Joi.string().valid('Male', 'Female', 'Other').required(),
  email: Joi.string().email().optional().allow('', null),
  city: Joi.string().optional().allow('', null),
  password: Joi.string().min(6).max(20).required(), // Password is optional for update
});

// Validation schema for patient login
export const patientLoginSchema = Joi.object({
  mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).required().messages({'string.pattern.base': 'Mobile number must be exactly 10 digits.'}),
  password: Joi.string().min(6).max(20).required(),
});

// Validation schema for OTP verification
export const otpVerificationSchema = Joi.object({
  otp: Joi.number().required(),
});

// Validation schema for contact us form
export const contactUsSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  message: Joi.string().required(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required().messages({'string.pattern.base': 'Phone number must be exactly 10 digits.'}),
  subject: Joi.string().required(),
  attachment: Joi.string().optional().allow('', null),
  type: Joi.string().valid('inquiry', 'feedback', 'complaint').default('inquiry'),
});
  
