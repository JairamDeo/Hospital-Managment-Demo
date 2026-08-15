import { customResponse } from '../../utils/response.js';
import { BILLING_MESSAGES, ErrorMessages, PANCHAKARMA_MESSAGES } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';
import { resolveApiErrorMessage } from '../../utils/resolveApiErrorMessage.js';
import {
  listInvoices,
  getInvoiceByCode,
  getBillingStats,
  createMedicineInvoice,
  collectInvoicePayment,
  createPanchakarmaInvoice,
} from '../services/hmsBilling.service.js';
import {
  createRazorpayOrderForInvoice,
  createRazorpayQrForInvoice,
  createRazorpayPaymentLinkForInvoice,
  retryRazorpayPaymentLinkForInvoice,
  getRazorpayCollectionStatus,
  getRazorpayPaymentLinkStatus,
  getRazorpayPublicConfig,
  handleRazorpayWebhook,
  verifyRazorpayPaymentForInvoice,
  buildOfflineCollectionSummary,
} from '../services/hmsBillingRazorpay.service.js';

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
  if (
    message === BILLING_MESSAGES.RAZORPAY_NOT_CONFIGURED ||
    message === BILLING_MESSAGES.RAZORPAY_MIN_AMOUNT ||
    message === BILLING_MESSAGES.RAZORPAY_INVALID_SIGNATURE ||
    message === BILLING_MESSAGES.RAZORPAY_INVALID_WEBHOOK ||
    message === BILLING_MESSAGES.RAZORPAY_ORDER_NOT_FOUND ||
    message === BILLING_MESSAGES.INVALID_PAYMENT_AMOUNT ||
    message === BILLING_MESSAGES.PAYMENT_EXCEEDS_BALANCE ||
    message === BILLING_MESSAGES.PATIENT_MOBILE_REQUIRED ||
    message === BILLING_MESSAGES.PAYMENT_LINK_SMS_NOT_CONFIGURED ||
    message === BILLING_MESSAGES.PAYMENT_LINK_NOTIFICATION_NOT_CONFIGURED
  ) {
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
    const collection = buildOfflineCollectionSummary(invoice, req);
    return customResponse(res, BILLING_MESSAGES.PAYMENT_COLLECTED, 200, { invoice, collection });
  } catch (error) {
    const status = billingErrorStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Collect payment error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postPanchakarmaPayment = async (req, res) => {
  try {
    const HmsPanchakarmaProgram = (await import('../../models/hmsPanchakarmaProgram.model.js')).default;
    const program = await HmsPanchakarmaProgram.findOne({ programCode: req.body.programCode });
    if (!program) throw new Error(PANCHAKARMA_MESSAGES.NOT_FOUND);

    const invoice = await createPanchakarmaInvoice(program, req, {
      markPaid: req.body.markPaid === true,
      paymentMethod: req.body.paymentMethod,
      payAmount: req.body.amount,
    });
    return customResponse(res, BILLING_MESSAGES.PAYMENT_COLLECTED, 200, { invoice });
  } catch (error) {
    const status = billingErrorStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Panchakarma payment error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getRazorpayConfig = async (_req, res) => {
  try {
    const config = getRazorpayPublicConfig();
    return customResponse(res, BILLING_MESSAGES.FETCHED, 200, { razorpay: config });
  } catch (error) {
    logger.error('Razorpay config error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postRazorpayOrder = async (req, res) => {
  try {
    const order = await createRazorpayOrderForInvoice(
      decodeParam(req.params.invoiceCode),
      req.body,
      req
    );
    return customResponse(res, BILLING_MESSAGES.RAZORPAY_ORDER_CREATED, 200, { order });
  } catch (error) {
    const status = billingErrorStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Create Razorpay order error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postRazorpayQr = async (req, res) => {
  try {
    const qr = await createRazorpayQrForInvoice(
      decodeParam(req.params.invoiceCode),
      req.body,
      req
    );
    return customResponse(res, BILLING_MESSAGES.RAZORPAY_QR_CREATED, 200, { qr });
  } catch (error) {
    const status = billingErrorStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Create Razorpay QR error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getRazorpayStatus = async (req, res) => {
  try {
    const status = await getRazorpayCollectionStatus(decodeParam(req.params.qrCodeId));
    return customResponse(res, BILLING_MESSAGES.FETCHED, 200, status);
  } catch (error) {
    const status = billingErrorStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Razorpay status error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postRazorpayPaymentLink = async (req, res) => {
  try {
    const paymentLink = await createRazorpayPaymentLinkForInvoice(
      decodeParam(req.params.invoiceCode),
      req.body,
      req
    );
    return customResponse(res, BILLING_MESSAGES.RAZORPAY_PAYMENT_LINK_CREATED, 200, { paymentLink });
  } catch (error) {
    const status = billingErrorStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Create Razorpay payment link error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postRazorpayPaymentLinkRetry = async (req, res) => {
  try {
    const paymentLink = await retryRazorpayPaymentLinkForInvoice(
      decodeParam(req.params.invoiceCode),
      req.body,
      req
    );
    return customResponse(res, BILLING_MESSAGES.RAZORPAY_PAYMENT_LINK_RETRY, 200, { paymentLink });
  } catch (error) {
    const status = billingErrorStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Retry Razorpay payment link error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const getRazorpayPaymentLinkStatusHandler = async (req, res) => {
  try {
    const status = await getRazorpayPaymentLinkStatus(decodeParam(req.params.paymentLinkId));
    return customResponse(res, BILLING_MESSAGES.FETCHED, 200, status);
  } catch (error) {
    const status = billingErrorStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Razorpay payment link status error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postRazorpayVerify = async (req, res) => {
  try {
    const result = await verifyRazorpayPaymentForInvoice(req.body, req);
    return customResponse(res, BILLING_MESSAGES.RAZORPAY_PAYMENT_VERIFIED, 200, result);
  } catch (error) {
    const status = billingErrorStatus(error.message);
    if (status !== 500) return customResponse(res, error.message, status);
    logger.error('Verify Razorpay payment error:', error);
    return customResponse(res, resolveApiErrorMessage(error), 500);
  }
};

export const postRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const result = await handleRazorpayWebhook(req.body, signature);
    return res.status(200).json({ received: true, ...result });
  } catch (error) {
    logger.error('Razorpay webhook error:', error);
    return res.status(400).json({ received: false, message: error.message });
  }
};
