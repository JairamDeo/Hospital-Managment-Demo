import Joi from 'joi';  

// Validation schema for user registration
export const userRegistrationSchema = Joi.object({
  mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    'string.pattern.base': 'Mobile number must be a 10-digit number',
    'any.required': 'Mobile number is required'
  }),
    email: Joi.string().email().optional().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required'
  }),
  name: Joi.string().min(3).max(50).optional().messages({
    'string.min': 'Name must be at least 3 characters long',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required'
  }),
    dob: Joi.date().optional().messages({
    'date.base': 'Invalid date format',
    'any.required': 'Date of birth is required'
  }),
    gender: Joi.string().valid('Male', 'Female', 'Other').optional().messages({
    'string.valid': 'Gender must be "male", "female", or "other"',
    'any.required': 'Gender is required'
  }),
    city: Joi.string().optional().messages({
    'string.base': 'City must be a string',
    'any.required': 'City is required'
  }),   
  role: Joi.string().valid('admin', 'doctor', 'nurse', 'receptionist', 'lab_technician', 'pharmacist').required().messages({
    'string.valid': 'Role must be one of the following: admin, doctor, nurse, receptionist, lab_technician, pharmacist',
    'any.required': 'Role is required'
  }),

});

// Validation schema for user login
export const userLoginSchema = Joi.object({
  mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    'string.pattern.base': 'Mobile number must be a 10-digit number',
    'any.required': 'Mobile number is required'
  }),
  password: Joi.string().min(8).max(20).optional().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password cannot exceed 20 characters',
    'any.required': 'Password is required'
  }),
});

