import { customResponse } from '../../utils/response.js';
import { APPOINTMENT_MESSAGES, ErrorMessages } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';
import { resolveApiErrorMessage } from '../../utils/resolveApiErrorMessage.js';
import {
  getAvailabilityForDoctor,
  createAppointment,
  listDoctorsForBooking,
} from '../../admin/services/hmsAppointment.service.js';
import { enrichPatientAppointmentsForPayment } from '../services/appointmentPayment.service.js';

const appointmentErrorStatus = (message) => {
  if (message === APPOINTMENT_MESSAGES.DOCTOR_SLOT_UNAVAILABLE) return 409;
  if (message === ErrorMessages.DOCTOR_NOT_FOUND) return 404;
  return 500;
};

export const patientListAppointments = async (req, res) => {
  try {
    const appointments = await enrichPatientAppointmentsForPayment(req.patient.patientCode);
    return customResponse(res, APPOINTMENT_MESSAGES.LIST_FETCHED, 200, { appointments });
  } catch (error) {
    logger.error('Patient list appointments error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const patientGetAvailability = async (req, res) => {
  try {
    const availability = await getAvailabilityForDoctor(req.query.staffCode, req.query.date);
    return customResponse(res, APPOINTMENT_MESSAGES.AVAILABILITY_FETCHED, 200, { availability });
  } catch (error) {
    logger.error('Patient availability error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const patientListDoctors = async (_req, res) => {
  try {
    const doctors = await listDoctorsForBooking();
    return customResponse(res, APPOINTMENT_MESSAGES.DOCTORS_FETCHED, 200, { doctors });
  } catch (error) {
    logger.error('Patient doctors list error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const patientBookAppointment = async (req, res) => {
  try {
    const createdBy = {
      type: 'patient',
      patientCode: req.patient.patientCode,
      name: req.patient.name,
    };

    const appointment = await createAppointment(
      {
        patientCode: req.patient.patientCode,
        staffCode: req.body.staffCode,
        appointmentType: req.body.appointmentType,
        date: req.body.date,
        timeSlot: req.body.timeSlot,
        notes: req.body.notes,
      },
      createdBy
    );

    return customResponse(res, APPOINTMENT_MESSAGES.CREATED, 201, { appointment });
  } catch (error) {
    const status = appointmentErrorStatus(error.message);
    if (status !== 500) {
      return customResponse(res, error.message, status);
    }
    logger.error('Patient book appointment error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};
