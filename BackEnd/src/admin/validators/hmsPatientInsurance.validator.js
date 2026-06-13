import Joi from 'joi';

const dependentSchema = Joi.object({
  name: Joi.string().trim().max(80).required(),
  relation: Joi.string().trim().max(40).allow('', null),
  age: Joi.number().integer().min(0).max(120).allow(null),
});

export const patientInsuranceUpdateSchema = Joi.object({
  insurance: Joi.object({
    providerName: Joi.string().trim().max(120).required(),
    policyNumber: Joi.string().trim().max(60).required(),
    policyType: Joi.string().valid('Individual', 'Family', 'Group').optional(),
    sumInsured: Joi.number().min(0).optional(),
    annualPremium: Joi.number().min(0).optional(),
    startDate: Joi.string().allow('', null).optional(),
    endDate: Joi.string().allow('', null).optional(),
    tpaName: Joi.string().trim().max(120).allow('', null).optional(),
    cardNumber: Joi.string().trim().max(60).allow('', null).optional(),
    dependents: Joi.array().items(dependentSchema).max(10).optional(),
    notes: Joi.string().trim().max(500).allow('', null).optional(),
    status: Joi.string().valid('Active', 'Expired', 'Pending', 'Cancelled').optional(),
  }).required(),
});
