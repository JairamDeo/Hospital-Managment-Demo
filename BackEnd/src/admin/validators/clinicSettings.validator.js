import Joi from 'joi';

export const updateClinicSettingsSchema = Joi.object({
  name: Joi.string().min(2).max(120).optional(),
  patientCodePrefix: Joi.string().min(1).max(8).pattern(/^[A-Za-z0-9]+$/).optional(),
  applyToExistingPatients: Joi.boolean().optional(),
}).min(1);
