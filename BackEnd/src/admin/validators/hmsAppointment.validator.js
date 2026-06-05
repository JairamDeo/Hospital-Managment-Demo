import Joi from 'joi';
import { APPOINTMENT_TIME_SLOTS, APPOINTMENT_TYPES } from '../../utils/appointment.util.js';

const appointmentType = Joi.string().valid(...APPOINTMENT_TYPES);
const timeSlot = Joi.string().valid(...APPOINTMENT_TIME_SLOTS);

export const createAppointmentSchema = Joi.object({
  patientCode: Joi.string().min(3).max(40).required(),
  staffCode: Joi.string().min(3).max(20).required(),
  appointmentType: appointmentType.required(),
  date: Joi.string().required(),
  timeSlot: timeSlot.required(),
  notes: Joi.string().max(500).allow('', null).optional(),
});

export const availabilityQuerySchema = Joi.object({
  staffCode: Joi.string().min(3).max(20).required(),
  date: Joi.string().required(),
});

export const patientCreateAppointmentSchema = Joi.object({
  staffCode: Joi.string().min(3).max(20).required(),
  appointmentType: appointmentType.required(),
  date: Joi.string().required(),
  timeSlot: timeSlot.required(),
  notes: Joi.string().max(500).allow('', null).optional(),
});
