import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { portalAuth } from '../../middleware/portalAuthMiddleware.js';
import {
  listBillingQuerySchema,
  collectPaymentSchema,
  createMedicineInvoiceSchema,
  createPanchakarmaPaymentSchema,
  createRazorpayOrderSchema,
  verifyRazorpayPaymentSchema,
} from '../validators/hmsBilling.validator.js';
import {
  getInvoices,
  getBillingStatsSummary,
  getInvoice,
  postMedicineInvoice,
  patchCollectPayment,
  postPanchakarmaPayment,
  getRazorpayConfig,
  postRazorpayOrder,
  postRazorpayQr,
  postRazorpayPaymentLink,
  postRazorpayPaymentLinkRetry,
  getRazorpayStatus,
  getRazorpayPaymentLinkStatusHandler,
  postRazorpayVerify,
} from '../controllers/hmsBilling.controller.js';
import { postInvoiceWhatsApp } from '../controllers/patientWhatsApp.controller.js';
import { whatsappDocumentUpload } from '../../middleware/whatsappDocumentUpload.middleware.js';
import { customResponse } from '../../utils/response.js';

const router = Router();

router.use(portalAuth);

router.get('/', validateRequest(listBillingQuerySchema, 'query'), getInvoices);
router.get('/stats/summary', getBillingStatsSummary);
router.get('/razorpay/config', getRazorpayConfig);
router.get('/razorpay/status/:qrCodeId', getRazorpayStatus);
router.get('/razorpay/payment-link/status/:paymentLinkId', getRazorpayPaymentLinkStatusHandler);
router.post('/razorpay/verify', validateRequest(verifyRazorpayPaymentSchema), postRazorpayVerify);
router.post('/medicine', validateRequest(createMedicineInvoiceSchema), postMedicineInvoice);
router.post('/panchakarma', validateRequest(createPanchakarmaPaymentSchema), postPanchakarmaPayment);
router.patch(
  '/:invoiceCode/collect',
  validateRequest(collectPaymentSchema),
  patchCollectPayment
);
router.post(
  '/:invoiceCode/razorpay/qr',
  validateRequest(createRazorpayOrderSchema),
  postRazorpayQr
);
router.post(
  '/:invoiceCode/razorpay/payment-link',
  validateRequest(createRazorpayOrderSchema),
  postRazorpayPaymentLink
);
router.post(
  '/:invoiceCode/razorpay/payment-link/retry',
  validateRequest(createRazorpayOrderSchema),
  postRazorpayPaymentLinkRetry
);
router.post(
  '/:invoiceCode/razorpay/order',
  validateRequest(createRazorpayOrderSchema),
  postRazorpayOrder
);
router.post('/:invoiceCode/whatsapp', (req, res, next) => {
  whatsappDocumentUpload(req, res, (err) => {
    if (err) {
      return customResponse(res, err.message || 'Invalid document file', 400);
    }
    next();
  });
}, postInvoiceWhatsApp);
router.get('/:invoiceCode', getInvoice);

export default router;
