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
  getRazorpayStatus,
  postRazorpayVerify,
} from '../controllers/hmsBilling.controller.js';

const router = Router();

router.use(portalAuth);

router.get('/', validateRequest(listBillingQuerySchema, 'query'), getInvoices);
router.get('/stats/summary', getBillingStatsSummary);
router.get('/razorpay/config', getRazorpayConfig);
router.get('/razorpay/status/:qrCodeId', getRazorpayStatus);
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
  '/:invoiceCode/razorpay/order',
  validateRequest(createRazorpayOrderSchema),
  postRazorpayOrder
);
router.get('/:invoiceCode', getInvoice);

export default router;
