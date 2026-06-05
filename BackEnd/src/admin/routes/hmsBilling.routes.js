import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { portalAuth } from '../../middleware/portalAuthMiddleware.js';
import {
  listBillingQuerySchema,
  collectPaymentSchema,
  createMedicineInvoiceSchema,
} from '../validators/hmsBilling.validator.js';
import {
  getInvoices,
  getBillingStatsSummary,
  getInvoice,
  postMedicineInvoice,
  patchCollectPayment,
} from '../controllers/hmsBilling.controller.js';

const router = Router();

router.use(portalAuth);

router.get('/', validateRequest(listBillingQuerySchema, 'query'), getInvoices);
router.get('/stats/summary', getBillingStatsSummary);
router.post('/medicine', validateRequest(createMedicineInvoiceSchema), postMedicineInvoice);
router.patch(
  '/:invoiceCode/collect',
  validateRequest(collectPaymentSchema),
  patchCollectPayment
);
router.get('/:invoiceCode', getInvoice);

export default router;
