import HmsInvoice from '../../models/hmsInvoice.model.js';
import HmsRazorpayPayment from '../../models/hmsRazorpayPayment.model.js';
import { BILLING_MESSAGES } from '../../utils/constants.js';
import { formatHmsInvoice } from '../../utils/formatHmsInvoice.js';
import {
  createRazorpayOrder,
  createRazorpayQrCode,
  fetchRazorpayQrPayments,
  getRazorpayKeyId,
  isRazorpayEnabled,
  mapRazorpayMethod,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from '../../services/payment/razorpay.service.js';
import { collectInvoicePayment, getInvoiceByCode } from './hmsBilling.service.js';
import { logger } from '../../utils/logger.js';

const performerFromReq = (req) => {
  if (req?.accountType === 'admin') {
    return {
      type: 'admin',
      name: req.admin?.firstName
        ? `${req.admin.firstName} ${req.admin.lastName || ''}`.trim()
        : req.admin?.email || 'Admin',
      adminId: req.admin?._id,
    };
  }
  if (req?.accountType === 'staff') {
    return {
      type: 'staff',
      name: req.staff?.name || 'Staff',
      staffCode: req.staff?.staffCode,
    };
  }
  return { type: 'admin', name: 'System' };
};

const reqFromInitiatedBy = (initiatedBy) => {
  if (!initiatedBy) return { accountType: 'admin', admin: { email: 'System' } };
  if (initiatedBy.type === 'staff') {
    return {
      accountType: 'staff',
      staff: { name: initiatedBy.name, staffCode: initiatedBy.staffCode },
    };
  }
  return {
    accountType: 'admin',
    admin: { firstName: initiatedBy.name, lastName: '' },
  };
};

const getInvoiceBalance = (row) => {
  const currentPaid = Number(row.amountPaid) || 0;
  return Math.max(0, row.amount - currentPaid);
};

const rupeesToPaise = (amount) => Math.round(Number(amount) * 100);

const feeTypeLabel = (feeType) => {
  if (feeType === 'Medicine') return 'Medicine / Pharmacy';
  if (feeType === 'Panchakarma') return 'Panchakarma';
  return 'Consultation / Doctor fee';
};

const buildCollectionSummary = (paymentRecord, invoice) => ({
  invoiceCode: invoice.invoiceCode,
  patientCode: invoice.patientCode,
  patientName: invoice.patientName,
  feeType: invoice.feeType,
  feeTypeLabel: feeTypeLabel(invoice.feeType),
  treatment: invoice.treatment,
  doctorName: invoice.doctorName || invoice.doctor || '',
  description: invoice.description || '',
  amount: paymentRecord?.amount ?? invoice.amount,
  paymentMethod: paymentRecord?.paymentMethod || invoice.paymentMethod || 'UPI',
  collectedBy: paymentRecord?.initiatedBy?.name || invoice.collectedBy?.name || 'Staff',
  status: invoice.status,
  paidAt: paymentRecord?.paidAt || invoice.paidAt,
});

export const getRazorpayPublicConfig = () => ({
  enabled: isRazorpayEnabled(),
  keyId: isRazorpayEnabled() ? getRazorpayKeyId() : '',
});

const resolvePayAmount = (row, payload) => {
  const balance = getInvoiceBalance(row);
  const payAmount =
    payload.amount != null && payload.amount !== '' ? Number(payload.amount) : balance;

  if (!Number.isFinite(payAmount) || payAmount <= 0) {
    throw new Error(BILLING_MESSAGES.INVALID_PAYMENT_AMOUNT);
  }
  if (payAmount > balance) {
    throw new Error(BILLING_MESSAGES.PAYMENT_EXCEEDS_BALANCE);
  }

  const amountPaise = rupeesToPaise(payAmount);
  if (amountPaise < 100) {
    throw new Error(BILLING_MESSAGES.RAZORPAY_MIN_AMOUNT);
  }

  return { payAmount, amountPaise, balance };
};

export const createRazorpayQrForInvoice = async (invoiceCode, payload = {}, req) => {
  if (!isRazorpayEnabled()) {
    throw new Error(BILLING_MESSAGES.RAZORPAY_NOT_CONFIGURED);
  }

  const row = await HmsInvoice.findOne({ invoiceCode });
  if (!row) throw new Error(BILLING_MESSAGES.NOT_FOUND);
  if (row.status === 'Paid') throw new Error(BILLING_MESSAGES.ALREADY_PAID);

  const { payAmount, amountPaise } = resolvePayAmount(row, payload);
  const initiatedBy = performerFromReq(req);
  const description =
    row.description ||
    `${feeTypeLabel(row.feeType)} — ${row.patientName}`.slice(0, 120);

  const closeByUnix = Math.floor(Date.now() / 1000) + 60 * 60;
  const qr = await createRazorpayQrCode({
    amountPaise,
    name: `INV ${invoiceCode}`.slice(0, 40),
    description,
    notes: {
      invoiceCode,
      patientCode: row.patientCode,
      feeType: row.feeType,
    },
    closeByUnix,
  });

  const paymentRecord = await HmsRazorpayPayment.create({
    invoiceCode,
    razorpayQrCodeId: qr.id,
    collectionType: 'qr',
    qrImageUrl: qr.image_url || '',
    qrShortUrl: qr.image_url || '',
    patientCode: row.patientCode,
    patientName: row.patientName,
    feeType: row.feeType,
    doctorName: row.doctorName || '',
    invoiceDescription: row.description || '',
    amountPaise,
    amount: payAmount,
    currency: 'INR',
    status: 'created',
    initiatedBy,
  });

  return {
    qrCodeId: qr.id,
    qrImageUrl: qr.image_url,
    amount: payAmount,
    amountPaise,
    currency: 'INR',
    invoiceCode,
    patientCode: row.patientCode,
    patientName: row.patientName,
    feeType: row.feeType,
    feeTypeLabel: feeTypeLabel(row.feeType),
    doctorName: row.doctorName || '',
    treatment: row.description || feeTypeLabel(row.feeType),
    description,
    collectedBy: initiatedBy.name,
    paymentRef: String(paymentRecord._id),
  };
};

export const createRazorpayOrderForInvoice = async (invoiceCode, payload = {}, req) => {
  if (!isRazorpayEnabled()) {
    throw new Error(BILLING_MESSAGES.RAZORPAY_NOT_CONFIGURED);
  }

  const row = await HmsInvoice.findOne({ invoiceCode });
  if (!row) throw new Error(BILLING_MESSAGES.NOT_FOUND);
  if (row.status === 'Paid') throw new Error(BILLING_MESSAGES.ALREADY_PAID);

  const { payAmount, amountPaise } = resolvePayAmount(row, payload);
  const receipt = `${invoiceCode}-${Date.now()}`.slice(0, 40);
  const order = await createRazorpayOrder({
    amountPaise,
    receipt,
    notes: { invoiceCode, patientCode: row.patientCode },
  });

  await HmsRazorpayPayment.create({
    invoiceCode,
    razorpayOrderId: order.id,
    collectionType: 'checkout',
    patientCode: row.patientCode,
    patientName: row.patientName,
    feeType: row.feeType,
    doctorName: row.doctorName || '',
    invoiceDescription: row.description || '',
    amountPaise,
    amount: payAmount,
    currency: order.currency || 'INR',
    status: 'created',
    initiatedBy: performerFromReq(req),
  });

  return {
    keyId: getRazorpayKeyId(),
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    invoiceCode,
    patientName: row.patientName,
    description: row.description || `Invoice ${invoiceCode}`,
  };
};

const fulfillRazorpayPayment = async ({
  paymentRecord,
  razorpayPaymentId,
  razorpayMethod,
  req,
}) => {
  if (!paymentRecord) return null;

  if (paymentRecord.status === 'paid') {
    const row = await HmsInvoice.findOne({ invoiceCode: paymentRecord.invoiceCode });
    if (!row) return null;
    const invoice = formatHmsInvoice(row);
    return { invoice, collection: buildCollectionSummary(paymentRecord, invoice) };
  }

  const actorReq = req || reqFromInitiatedBy(paymentRecord.initiatedBy);
  const invoice = await collectInvoicePayment(
    paymentRecord.invoiceCode,
    {
      amount: paymentRecord.amount,
      paymentMethod: mapRazorpayMethod(razorpayMethod),
    },
    actorReq
  );

  paymentRecord.status = 'paid';
  paymentRecord.razorpayPaymentId = razorpayPaymentId || paymentRecord.razorpayPaymentId;
  paymentRecord.paymentMethod = mapRazorpayMethod(razorpayMethod);
  paymentRecord.paidAt = new Date();
  await paymentRecord.save();

  return { invoice, collection: buildCollectionSummary(paymentRecord, invoice) };
};

const tryFulfillFromQrPayments = async (paymentRecord) => {
  if (!paymentRecord?.razorpayQrCodeId) return null;
  const payments = await fetchRazorpayQrPayments(paymentRecord.razorpayQrCodeId);
  const items = payments?.items ?? payments ?? [];
  const captured = items.find((p) => p.status === 'captured');
  if (!captured) return null;

  return fulfillRazorpayPayment({
    paymentRecord,
    razorpayPaymentId: captured.id,
    razorpayMethod: captured.method,
    req: null,
  });
};

export const getRazorpayCollectionStatus = async (qrCodeId) => {
  const paymentRecord = await HmsRazorpayPayment.findOne({ razorpayQrCodeId: qrCodeId });
  if (!paymentRecord) throw new Error(BILLING_MESSAGES.RAZORPAY_ORDER_NOT_FOUND);

  if (paymentRecord.status === 'paid') {
    const invoice = await getInvoiceByCode(paymentRecord.invoiceCode);
    return {
      status: 'paid',
      invoice,
      collection: buildCollectionSummary(paymentRecord, invoice),
    };
  }

  if (!isRazorpayEnabled()) {
    return { status: 'pending', qrCodeId, amount: paymentRecord.amount };
  }

  try {
    const result = await tryFulfillFromQrPayments(paymentRecord);
    if (result) {
      return { status: 'paid', invoice: result.invoice, collection: result.collection };
    }
  } catch (error) {
    logger.warn(`Razorpay QR poll error for ${qrCodeId}:`, error.message);
  }

  return {
    status: 'pending',
    qrCodeId,
    amount: paymentRecord.amount,
    invoiceCode: paymentRecord.invoiceCode,
    patientName: paymentRecord.patientName,
  };
};

export const verifyRazorpayPaymentForInvoice = async (payload, req) => {
  if (!isRazorpayEnabled()) {
    throw new Error(BILLING_MESSAGES.RAZORPAY_NOT_CONFIGURED);
  }

  const { invoiceCode, razorpayOrderId, razorpayPaymentId, razorpaySignature } = payload;

  const valid = verifyRazorpayPaymentSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });
  if (!valid) throw new Error(BILLING_MESSAGES.RAZORPAY_INVALID_SIGNATURE);

  const paymentRecord = await HmsRazorpayPayment.findOne({
    razorpayOrderId,
    invoiceCode,
  });
  if (!paymentRecord) throw new Error(BILLING_MESSAGES.RAZORPAY_ORDER_NOT_FOUND);

  return fulfillRazorpayPayment({
    paymentRecord,
    razorpayPaymentId,
    razorpayMethod: payload.razorpayMethod,
    req,
  });
};

const fulfillByOrderId = async (orderId, paymentEntity, req = null) => {
  const paymentRecord = await HmsRazorpayPayment.findOne({ razorpayOrderId: orderId });
  if (!paymentRecord) return { handled: false, reason: 'order_not_found' };
  if (paymentRecord.status === 'paid') {
    return { handled: true, reason: 'already_paid', invoiceCode: paymentRecord.invoiceCode };
  }
  await fulfillRazorpayPayment({
    paymentRecord,
    razorpayPaymentId: paymentEntity?.id || '',
    razorpayMethod: paymentEntity?.method,
    req,
  });
  return { handled: true, invoiceCode: paymentRecord.invoiceCode };
};

const fulfillByQrCodeId = async (qrCodeId, paymentEntity) => {
  const paymentRecord = await HmsRazorpayPayment.findOne({ razorpayQrCodeId: qrCodeId });
  if (!paymentRecord) return { handled: false, reason: 'qr_not_found' };
  if (paymentRecord.status === 'paid') {
    return { handled: true, reason: 'already_paid', invoiceCode: paymentRecord.invoiceCode };
  }
  await fulfillRazorpayPayment({
    paymentRecord,
    razorpayPaymentId: paymentEntity?.id || '',
    razorpayMethod: paymentEntity?.method,
    req: null,
  });
  return { handled: true, invoiceCode: paymentRecord.invoiceCode };
};

export const handleRazorpayWebhook = async (rawBody, signature) => {
  if (!isRazorpayEnabled()) {
    return { handled: false, reason: 'disabled' };
  }

  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    throw new Error(BILLING_MESSAGES.RAZORPAY_INVALID_WEBHOOK);
  }

  const event = JSON.parse(rawBody.toString('utf8'));
  const eventType = event?.event;
  const paymentEntity = event?.payload?.payment?.entity || null;

  if (eventType === 'qr_code.credited') {
    const qrId = event?.payload?.qr_code?.entity?.id;
    if (!qrId) return { handled: false, reason: 'no_qr_id' };
    return fulfillByQrCodeId(qrId, paymentEntity);
  }

  if (eventType === 'payment.captured' || eventType === 'order.paid') {
    const orderId =
      paymentEntity?.order_id ||
      event?.payload?.order?.entity?.id ||
      event?.payload?.payment?.entity?.order_id;

    if (orderId) {
      return fulfillByOrderId(orderId, paymentEntity);
    }

    const qrId = paymentEntity?.qr_code_id || paymentEntity?.notes?.qr_code_id;
    if (qrId) {
      return fulfillByQrCodeId(qrId, paymentEntity);
    }

    return { handled: false, reason: 'no_order_or_qr_id' };
  }

  return { handled: false, reason: 'ignored', event: eventType };
};

export const buildOfflineCollectionSummary = (invoice, req) => {
  const initiatedBy = performerFromReq(req);
  return buildCollectionSummary(
    {
      amount: invoice.paidAmount ?? invoice.amountPaid,
      paymentMethod: invoice.paymentMethod,
      initiatedBy,
      paidAt: invoice.paidAt,
    },
    invoice
  );
};
