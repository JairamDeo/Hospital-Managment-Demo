import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { adminAuth } from '../../middleware/adminAuthMiddleware.js';
import { pharmacyCsvUpload } from '../../middleware/pharmacyUpload.middleware.js';
import { createPharmacyItemSchema } from '../validators/pharmacy.validator.js';
import { PHARMACY_MESSAGES } from '../../utils/constants.js';
import { customResponse } from '../../utils/response.js';
import {
  getPharmacy,
  postPharmacyItem,
  downloadPharmacyCsv,
  downloadPharmacyPdf,
  downloadPharmacyImportTemplate,
  postPharmacyImport,
} from '../controllers/pharmacy.controller.js';

const router = Router();

router.use(adminAuth);

router.get('/', getPharmacy);
router.get('/export/csv', downloadPharmacyCsv);
router.get('/export/pdf', downloadPharmacyPdf);
router.get('/import/template', downloadPharmacyImportTemplate);

router.post('/', validateRequest(createPharmacyItemSchema), postPharmacyItem);

router.post('/import', (req, res, next) => {
  pharmacyCsvUpload(req, res, (err) => {
    if (err) {
      return customResponse(
        res,
        err.message || PHARMACY_MESSAGES.IMPORT_INVALID_FILE,
        400
      );
    }
    next();
  });
}, postPharmacyImport);

export default router;
