import Joi from 'joi';
import { PANCHAKARMA_THERAPIES } from '../../utils/panchakarma.util.js';

export const createPanchakarmaProgramSchema = Joi.object({
  patientCode: Joi.string().min(3).max(40).required(),
  staffCode: Joi.string().min(3).max(20).optional(),
  therapy: Joi.string()
    .valid(...PANCHAKARMA_THERAPIES)
    .required(),
  totalDays: Joi.number().integer().min(1).max(30).required(),
  roomCode: Joi.string().min(3).max(20).required(),
  startDate: Joi.string().required(),
  treatmentName: Joi.string().trim().max(120).allow('', null).optional(),
  totalFees: Joi.number().min(0).optional(),
  dailySessions: Joi.array()
    .items(
      Joi.object({
        dayNumber: Joi.number().integer().min(1).required(),
        sessionDate: Joi.string().allow('', null).optional(),
        time: Joi.string().max(20).allow('', null).optional(),
        duration: Joi.string().max(40).allow('', null).optional(),
        panchakarmaType: Joi.string().max(40).allow('', null).optional(),
        medicineContent: Joi.string().max(500).allow('', null).optional(),
      })
    )
    .optional(),
});

export const attendPanchakarmaProgramSchema = Joi.object({
  treatmentName: Joi.string().trim().max(120).allow('', null).optional(),
  totalFees: Joi.number().min(0).required(),
  dailySessions: Joi.array()
    .items(
      Joi.object({
        dayNumber: Joi.number().integer().min(1).required(),
        sessionDate: Joi.string().allow('', null).optional(),
        time: Joi.string().max(20).allow('', null).optional(),
        duration: Joi.string().max(40).allow('', null).optional(),
        panchakarmaType: Joi.string().max(40).allow('', null).optional(),
        medicineContent: Joi.string().max(500).allow('', null).optional(),
      })
    )
    .min(1)
    .required(),
});
