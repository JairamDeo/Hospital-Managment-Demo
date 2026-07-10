import crypto from 'crypto';
import Razorpay from 'razorpay';
import { BILLING_MESSAGES } from '../../utils/constants.js';

let razorpayClient = null;

export const isRazorpayEnabled = () =>
  process.env.RAZORPAY_ENABLED === 'true' &&
  Boolean(process.env.RAZORPAY_KEY_ID?.trim()) &&
  Boolean(process.env.RAZORPAY_KEY_SECRET?.trim());

export const getRazorpayKeyId = () => process.env.RAZORPAY_KEY_ID?.trim() || '';

const getClient = () => {
  if (!isRazorpayEnabled()) {
    throw new Error(BILLING_MESSAGES.RAZORPAY_NOT_CONFIGURED);
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID.trim(),
      key_secret: process.env.RAZORPAY_KEY_SECRET.trim(),
    });
  }
  return razorpayClient;
};

export const createRazorpayOrder = async ({ amountPaise, receipt, notes = {} }) => {
  const client = getClient();
  return client.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt,
    notes,
  });
};

export const createRazorpayQrCode = async ({
  amountPaise,
  name,
  description,
  notes = {},
  closeByUnix,
}) => {
  const client = getClient();
  const payload = {
    type: 'upi_qr',
    name,
    usage: 'single_use',
    fixed_amount: true,
    payment_amount: amountPaise,
    description,
    notes,
  };
  if (closeByUnix) payload.close_by = closeByUnix;
  return client.qrCode.create(payload);
};

export const fetchRazorpayQrPayments = async (qrCodeId) => {
  const client = getClient();
  return client.qrCode.fetchAllPayments(qrCodeId, { count: 5 });
};

export const createRazorpayPaymentLink = async ({
  amountPaise,
  description,
  customer,
  notes = {},
  expireByUnix,
}) => {
  const client = getClient();
  const payload = {
    amount: amountPaise,
    currency: 'INR',
    description: description.slice(0, 255),
    customer: {
      name: customer.name?.slice(0, 50) || 'Patient',
      contact: customer.contact,
    },
    notify: { sms: false, email: false },
    reminder_enable: false,
    notes,
  };
  if (expireByUnix) payload.expire_by = expireByUnix;
  return client.paymentLink.create(payload);
};

export const fetchRazorpayPaymentLink = async (paymentLinkId) => {
  const client = getClient();
  return client.paymentLink.fetch(paymentLinkId);
};

export const verifyRazorpayPaymentSignature = ({ orderId, paymentId, signature }) => {
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret || !orderId || !paymentId || !signature) return false;

  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expected === signature;
};

export const verifyRazorpayWebhookSignature = (rawBody, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret || !signature) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return expected === signature;
};

export const mapRazorpayMethod = (method = '') => {
  const key = String(method).toLowerCase();
  if (key === 'card') return 'Card';
  if (key === 'netbanking') return 'Net Banking';
  if (key === 'upi' || key === 'wallet' || key === 'emi') return 'UPI';
  return 'UPI';
};
