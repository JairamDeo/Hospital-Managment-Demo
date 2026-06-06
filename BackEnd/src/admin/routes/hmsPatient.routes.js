import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { portalAuth } from '../../middleware/portalAuthMiddleware.js';
import {
  adminCreatePatientSchema,
  adminUpdatePatientSchema,
} from '../validators/hmsPatient.validator.js';
import { adminUpdatePatientClinicalSchema } from '../validators/hmsPatientClinical.validator.js';
import { customResponse } from '../../utils/response.js';
import { prescriptionPdfUpload } from '../../middleware/prescriptionUpload.middleware.js';
import {
  getPatientsStats,
  getPatientOverviewHandler,
  getPatients,
  getPatient,
  getPatientClinical,
  postPatient,
  patchPatient,
  patchPatientClinical,
} from '../controllers/hmsPatient.controller.js';
import {
  getStructuredPrescriptions,
  postStructuredPrescription,
  getStructuredPrescriptionPdf,
  getStructuredPrescriptionByCode,
} from '../controllers/hmsStructuredPrescription.controller.js';
import {
  getPatientVitalsHistory,
  postPatientVitals,
} from '../controllers/patientVitals.controller.js';
import {
  getPatientPrescriptions,
  postPatientPrescription,
  viewPatientPrescriptionPdf,
  deletePatientPrescriptionHandler,
} from '../controllers/patientPrescription.controller.js';
import { PATIENT_MESSAGES } from '../../utils/constants.js';

const router = Router();

router.use(portalAuth);

router.get('/', getPatients);
router.get('/stats/summary', getPatientsStats);
router.get('/:patientCode/overview', getPatientOverviewHandler);
router.get('/:patientCode/clinical', getPatientClinical);
router.patch(
  '/:patientCode/clinical',
  validateRequest(adminUpdatePatientClinicalSchema),
  patchPatientClinical
);
router.get('/:patientCode/vitals', getPatientVitalsHistory);
router.post('/:patientCode/vitals', postPatientVitals);
router.get('/:patientCode/structured-prescriptions', getStructuredPrescriptions);
router.post('/:patientCode/structured-prescriptions', postStructuredPrescription);
router.get(
  '/:patientCode/structured-prescriptions/:prescriptionCode',
  getStructuredPrescriptionByCode
);
router.get(
  '/:patientCode/structured-prescriptions/:prescriptionCode/pdf',
  getStructuredPrescriptionPdf
);
router.get('/:patientCode/prescriptions', getPatientPrescriptions);
router.post('/:patientCode/prescriptions', (req, res, next) => {
  prescriptionPdfUpload(req, res, (err) => {
    if (err) {
      return customResponse(
        res,
        err.message || PATIENT_MESSAGES.PRESCRIPTION_FILE_REQUIRED,
        400
      );
    }
    next();
  });
}, postPatientPrescription);
router.get(
  '/:patientCode/prescriptions/:prescriptionId/view',
  viewPatientPrescriptionPdf
);
router.delete(
  '/:patientCode/prescriptions/:prescriptionId',
  deletePatientPrescriptionHandler
);
router.get('/:patientCode', getPatient);
router.post('/', validateRequest(adminCreatePatientSchema), postPatient);
router.patch('/:patientCode', validateRequest(adminUpdatePatientSchema), patchPatient);

export default router;
