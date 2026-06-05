import { customResponse } from '../../utils/response.js';
import { BILLING_MESSAGES, ErrorMessages } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';
import { resolveApiErrorMessage } from '../../utils/resolveApiErrorMessage.js';
import {
  listInvoices,
  getInvoiceByCode,
  getBillingStats,
  createMedicineInvoice,
  collectInvoicePayment,
} from '../services/hmsBilling.service.js';

const decodeParam = (param) => decodeURIComponent(param ?? '');

const billingErrorStatus = (message) => {
  if (message === BILLING_MESSAGES.NOT_FOUND) return 404;
  if (
    message === BILLING_MESSAGES.ALREADY_PAID ||
    message === BILLING_MESSAGES.INSUFFICIENT_STOCK ||
    message.startsWith(BILLING_MESSAGES.INSUFFICIENT_STOCK) ||
    message.startsWith(BILLING_MESSAGES.PRICE_REQUIRED)
  ) {
    return 409;
  }
  if (
    message === ErrorMessages.PATIENT_NOT_FOUND ||
    message === BILLING_MESSAGES.ITEM_NOT_FOUND
  ) {
    return 404;
  }
  if (message === BILLING_MESSAGES.ITEMS_REQUIRED || message === BILLING_MESSAGES.INVALID_QUANTITY) {
    return 400;
  }
  return 500;
};

export const getInvoices = async (req, res) => {
  try {
    const invoices = await listInvoices(req.query);
    return customResponse(res, BILLING_MESSAGES.LIST_FETCHED, 200, { invoices });
  } catch (error) {
    logger.error('List invoices error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getBillingStatsSummary = async (req, res) => {
  try {
    const stats = await getBillingStats();
    return customResponse(res, BILLING_MESSAGES.STATS_FETCHED, 200, { stats });
  } catch (error) {
    logger.error('Billing stats error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getInvoice = async (req, res) => {
  try {
    const invoice = await getInvoiceByCode(decodeParam(req.params.invoiceCode));
    return customResponse(res, BILLING_MESSAGES.FETCHED, 200, { invoice });
  } catch (error) {
    const status = billingErrorStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Get invoice error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postMedicineInvoice = async (req, res) => {
  try {
    const invoice = await createMedicineInvoice(req.body, req);
    return customResponse(res, BILLING_MESSAGES.CREATED, 201, { invoice });
  } catch (error) {
    const status = billingErrorStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Create medicine invoice error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const patchCollectPayment = async (req, res) => {
  try {
    const invoice = await collectInvoicePayment(decodeParam(req.params.invoiceCode), req.body, req);
    return customResponse(res, BILLING_MESSAGES.PAYMENT_COLLECTED, 200, { invoice });
  } catch (error) {
    const status = billingErrorStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Collect payment error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};
