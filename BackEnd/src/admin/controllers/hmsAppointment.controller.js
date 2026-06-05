import { customResponse } from '../../utils/response.js';
import { APPOINTMENT_MESSAGES, ErrorMessages } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';
import { resolveApiErrorMessage } from '../../utils/resolveApiErrorMessage.js';
import {
  listAppointments,
  listAppointmentsByStaff,
  getAvailabilityForDoctor,
  getAppointmentStats,
  createAppointment,
  listDoctorsForBooking,
} from '../services/hmsAppointment.service.js';

const decodeParam = (param) => decodeURIComponent(param ?? '');

const appointmentErrorStatus = (message) => {
  if (
    message === APPOINTMENT_MESSAGES.DOCTOR_SLOT_UNAVAILABLE ||
    message === APPOINTMENT_MESSAGES.STAFF_NOT_DOCTOR
  ) {
    return 409;
  }
  if (
    message === ErrorMessages.PATIENT_NOT_FOUND ||
    message === ErrorMessages.DOCTOR_NOT_FOUND
  ) {
    return 404;
  }
  return 500;
};

export const getAppointments = async (req, res) => {
  try {
    const staffCode =
      req.accountType === 'staff' && req.staff?.role === 'Doctor' ? req.staff.staffCode : null;
    const appointments = await listAppointments(staffCode);
    return customResponse(res, APPOINTMENT_MESSAGES.LIST_FETCHED, 200, { appointments });
  } catch (error) {
    logger.error('List appointments error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getAppointmentsStats = async (_req, res) => {
  try {
    const stats = await getAppointmentStats();
    return customResponse(res, APPOINTMENT_MESSAGES.STATS_FETCHED, 200, { stats });
  } catch (error) {
    logger.error('Appointment stats error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getStaffAppointments = async (req, res) => {
  try {
    const appointments = await listAppointmentsByStaff(decodeParam(req.params.staffCode));
    return customResponse(res, APPOINTMENT_MESSAGES.LIST_FETCHED, 200, { appointments });
  } catch (error) {
    logger.error('Staff appointments error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getAppointmentAvailability = async (req, res) => {
  try {
    const availability = await getAvailabilityForDoctor(req.query.staffCode, req.query.date);
    return customResponse(res, APPOINTMENT_MESSAGES.AVAILABILITY_FETCHED, 200, { availability });
  } catch (error) {
    logger.error('Appointment availability error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postAppointment = async (req, res) => {
  try {
    const createdBy = {
      type: 'admin',
      adminId: req.admin?._id,
      name: req.admin?.name || req.staff?.name || 'Staff',
    };

    const appointment = await createAppointment(
      {
        patientCode: req.body.patientCode,
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
    logger.error('Create appointment error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getDoctorsForBooking = async (_req, res) => {
  try {
    const doctors = await listDoctorsForBooking();
    return customResponse(res, APPOINTMENT_MESSAGES.DOCTORS_FETCHED, 200, { doctors });
  } catch (error) {
    logger.error('List doctors error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};
