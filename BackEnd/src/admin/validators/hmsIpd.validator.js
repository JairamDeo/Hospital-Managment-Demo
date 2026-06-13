import Joi from 'joi';

export const createIpdAdmissionSchema = Joi.object({
  patientCode: Joi.string().min(3).max(40).required(),
  roomCode: Joi.string().min(3).max(20).required(),
  staffCode: Joi.string().min(3).max(20).required(),
  admittedAt: Joi.string().required(),
  expectedDischargeAt: Joi.string().allow('', null).optional(),
  diagnosis: Joi.string().trim().max(500).allow('', null).optional(),
  chiefComplaint: Joi.string().trim().max(500).allow('', null).optional(),
});

export const addIpdCaseNoteSchema = Joi.object({
  treatmentGiven: Joi.string().trim().max(1000).allow('', null).optional(),
  medicines: Joi.string().trim().max(1000).allow('', null).optional(),
  observations: Joi.string().trim().max(1000).allow('', null).optional(),
  noteDate: Joi.string().allow('', null).optional(),
});

export const dischargeIpdSchema = Joi.object({
  diagnosis: Joi.string().trim().max(500).allow('', null).optional(),
  treatmentSummary: Joi.string().trim().max(2000).required(),
  medicinesAtDischarge: Joi.string().trim().max(1000).allow('', null).optional(),
  advice: Joi.string().trim().max(1000).allow('', null).optional(),
  followUpDate: Joi.string().allow('', null).optional(),
});
