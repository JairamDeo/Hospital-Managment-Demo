import Joi from 'joi';
import { QUALIFICATION_LEVELS } from '../../config/prescriptionBranding.config.js';

const staffRole = Joi.string().valid('Doctor', 'Therapist', 'Support', 'Lab');
const dutyStatus = Joi.string().valid('On Duty', 'Off Duty');

const aadharSchema = Joi.string()
  .pattern(/^[0-9]{12}$/)
  .messages({ 'string.pattern.base': 'Aadhar must be 12 digits' });

const panSchema = Joi.string()
  .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/i)
  .messages({ 'string.pattern.base': 'Invalid PAN format (e.g. ABCDE1234F)' });

const qualificationSchema = Joi.object({
  level: Joi.string()
    .valid(...QUALIFICATION_LEVELS)
    .required(),
  degree: Joi.string().trim().min(2).max(80).required(),
});

const money = Joi.number().min(0);

const staffCompensationSchema = Joi.object({
  basicSalary: money,
  hra: money,
  dearnessAllowance: money,
  specialAllowance: money,
  transportAllowance: money,
  medicalAllowance: money,
  otherAllowances: money,
  pfDeduction: money,
  professionalTax: money,
  otherDeductions: money,
}).optional();

export const staffCompensationUpdateSchema = Joi.object({
  compensation: staffCompensationSchema.required(),
  consultationFee: money.optional(),
}).min(1);

const staffProfessionalFields = {
  qualifications: Joi.array().items(qualificationSchema).min(1).required(),
  registrationNumber: Joi.string().trim().max(40).allow('', null),
  aadharNumber: aadharSchema.required(),
  panNumber: panSchema.required(),
};

export const adminCreateStaffSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  role: staffRole.required(),
  title: Joi.string().min(2).max(120).required(),
  shift: Joi.string().max(40).allow('', null).optional(),
  tags: Joi.array().items(Joi.string().trim().max(40)).max(8).optional(),
  consultationFee: Joi.number().min(0).optional(),
  ...staffProfessionalFields,
}).custom((value, helpers) => {
  if (['Doctor', 'Therapist'].includes(value.role) && !value.registrationNumber?.trim()) {
    return helpers.error('any.custom', {
      message: 'Registration number is required for doctors and therapists',
    });
  }
  return value;
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
  consultationFee: Joi.number().min(0),
  qualifications: Joi.array().items(qualificationSchema).min(1),
  registrationNumber: Joi.string().trim().max(40).allow('', null),
  aadharNumber: aadharSchema,
  panNumber: panSchema,
})
  .min(1)
  .custom((value, helpers) => {
    const role = value.role;
    if (role && ['Doctor', 'Therapist'].includes(role) && value.registrationNumber === '') {
      return helpers.error('any.custom', {
        message: 'Registration number is required for doctors and therapists',
      });
    }
    return value;
  });
