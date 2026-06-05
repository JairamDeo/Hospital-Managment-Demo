import Joi from 'joi';
import {
  PANCHAKARMA_DAY_OPTIONS,
  PANCHAKARMA_ROOMS,
  PANCHAKARMA_THERAPIES,
} from '../../utils/panchakarma.util.js';

export const createPanchakarmaProgramSchema = Joi.object({
  patientCode: Joi.string().min(3).max(40).required(),
  staffCode: Joi.string().min(3).max(20).required(),
  therapy: Joi.string()
    .valid(...PANCHAKARMA_THERAPIES)
    .required(),
  totalDays: Joi.number()
    .valid(...PANCHAKARMA_DAY_OPTIONS)
    .required(),
  room: Joi.string()
    .valid(...PANCHAKARMA_ROOMS)
    .required(),
  startDate: Joi.string().required(),
});
