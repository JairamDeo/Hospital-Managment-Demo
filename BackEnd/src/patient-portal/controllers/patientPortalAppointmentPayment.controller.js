import { customResponse } from '../../utils/response.js';
import { APPOINTMENT_MESSAGES, BILLING_MESSAGES } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';
import { resolveApiErrorMessage } from '../../utils/resolveApiErrorMessage.js';
import { getRazorpayPublicConfig } from '../../admin/services/hmsBillingRazorpay.service.js';
import {
  createPatientAppointmentRazorpayOrder,
  getPatientAppointmentPaymentStatus,
  verifyPatientAppointmentRazorpayPayment,
} from '../services/appointmentPayment.service.js';

const paymentErrorStatus = (message) => {
  if (
    message === APPOINTMENT_MESSAGES.NOT_FOUND ||
    message === BILLING_MESSAGES.RAZORPAY_ORDER_NOT_FOUND
  ) {
    return 404;
  }
  if (
    message === APPOINTMENT_MESSAGES.ALREADY_PAID ||
    message === APPOINTMENT_MESSAGES.CANCELLED_NO_PAY ||
    message === APPOINTMENT_MESSAGES.PAYMENT_NOT_REQUIRED ||
    message === APPOINTMENT_MESSAGES.PAYMENT_UNAVAILABLE ||
    message === BILLING_MESSAGES.RAZORPAY_NOT_CONFIGURED ||
    message === BILLING_MESSAGES.RAZORPAY_INVALID_SIGNATURE
  ) {
    return 400;
  }
  return 500;
};

export const patientGetRazorpayConfig = async (_req, res) => {
  try {
    return customResponse(res, BILLING_MESSAGES.LIST_FETCHED, 200, {
      razorpay: getRazorpayPublicConfig(),
    });
  } catch (error) {
    logger.error('Patient razorpay config error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const patientGetAppointmentPaymentStatus = async (req, res) => {
  try {
    const result = await getPatientAppointmentPaymentStatus(
      req.params.appointmentCode,
      req.patient.patientCode
    );
    return customResponse(res, APPOINTMENT_MESSAGES.FETCHED, 200, result);
  } catch (error) {
    const status = paymentErrorStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Patient appointment payment status error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const patientCreateAppointmentRazorpayOrder = async (req, res) => {
  try {
    const result = await createPatientAppointmentRazorpayOrder(
      req.params.appointmentCode,
      req
    );
    return customResponse(res, APPOINTMENT_MESSAGES.PAYMENT_ORDER_CREATED, 200, result);
  } catch (error) {
    const status = paymentErrorStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Patient appointment razorpay order error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const patientVerifyAppointmentRazorpayPayment = async (req, res) => {
  try {
    const result = await verifyPatientAppointmentRazorpayPayment(req.body, req);
    return customResponse(res, APPOINTMENT_MESSAGES.PAYMENT_VERIFIED, 200, result);
  } catch (error) {
    const status = paymentErrorStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Patient appointment razorpay verify error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};
