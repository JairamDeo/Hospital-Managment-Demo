import Joi from 'joi';
import { APPOINTMENT_TYPES, CONSULTATION_MODES } from '../../utils/appointment.util.js';

const appointmentType = Joi.string().valid(...APPOINTMENT_TYPES);
const consultationMode = Joi.string().valid(...CONSULTATION_MODES);
const timeSlot = Joi.string().pattern(/^(1[0-2]|0?[1-9]):[0-5][0-9] (AM|PM)$/i);

export const createAppointmentSchema = Joi.object({
  patientCode: Joi.string().min(3).max(40).required(),
  staffCode: Joi.string().min(3).max(20).required(),
  appointmentType: appointmentType.optional().default('Diet Consult'),
  consultationMode: consultationMode.optional().default('Offline'),
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
  appointmentType: appointmentType.optional().default('Diet Consult'),
  consultationMode: consultationMode.optional().default('Offline'),
  date: Joi.string().required(),
  timeSlot: timeSlot.required(),
  notes: Joi.string().max(500).allow('', null).optional(),
});

export const cancelAppointmentSchema = Joi.object({
  reason: Joi.string().max(500).allow('', null).optional(),
});

export const rescheduleAppointmentSchema = Joi.object({
  date: Joi.string().required(),
  timeSlot: timeSlot.required(),
  consultationMode: consultationMode.optional(),
  notes: Joi.string().max(500).allow('', null).optional(),
});

export const attendAppointmentSchema = Joi.object({
  consultationFee: Joi.number().min(0).optional(),
  visitNotes: Joi.string().max(2000).allow('', null).optional(),
  followUpDate: Joi.string().allow('', null).optional(),
  followUpTimeSlot: timeSlot.allow('', null).optional(),
  followUpNotes: Joi.string().max(500).allow('', null).optional(),
  markPaid: Joi.boolean().optional(),
  paymentMethod: Joi.string().valid('Cash', 'UPI', 'Card').optional(),
});
