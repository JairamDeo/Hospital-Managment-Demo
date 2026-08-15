import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { portalAuth } from '../../middleware/portalAuthMiddleware.js';
import {
  adminCreatePatientSchema,
  adminUpdatePatientSchema,
} from '../validators/hmsPatient.validator.js';
import { adminUpdatePatientClinicalSchema } from '../validators/hmsPatientClinical.validator.js';
import { patientInsuranceUpdateSchema } from '../validators/hmsPatientInsurance.validator.js';
import { customResponse } from '../../utils/response.js';
import { prescriptionPdfUpload } from '../../middleware/prescriptionUpload.middleware.js';
import {
  getPatientsStats,
  getPatientOverviewHandler,
  getPatientTreatmentHistoryHandler,
  getPatients,
  getPatient,
  getPatientClinical,
  postPatient,
  patchPatient,
  patchPatientClinical,
  getPatientInsuranceList,
  getPatientInsuranceStatsSummary,
  patchPatientInsurance,
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
import {
  postStructuredPrescriptionWhatsApp,
  postUploadedPrescriptionWhatsApp,
} from '../controllers/patientWhatsApp.controller.js';
import {
  getAiConsultationSamples,
  getAiConsultationSummaries,
  postAiConsultationHindi,
  postAiConsultationSummary,
} from '../controllers/consultationAi.controller.js';
import { PATIENT_MESSAGES } from '../../utils/constants.js';

const router = Router();

router.use(portalAuth);

router.get('/ai-consultation/samples', getAiConsultationSamples);

router.get('/', getPatients);
router.get('/stats/summary', getPatientsStats);
router.get('/insurance/list', getPatientInsuranceList);
router.get('/insurance/stats/summary', getPatientInsuranceStatsSummary);
router.get('/:patientCode/overview', getPatientOverviewHandler);
router.get('/:patientCode/treatment-history', getPatientTreatmentHistoryHandler);
router.get('/:patientCode/ai-consultation/summaries', getAiConsultationSummaries);
router.post('/:patientCode/ai-consultation', postAiConsultationSummary);
router.post(
  '/:patientCode/ai-consultation/:summaryCode/hindi',
  postAiConsultationHindi
);
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
router.post(
  '/:patientCode/structured-prescriptions/:prescriptionCode/whatsapp',
  postStructuredPrescriptionWhatsApp
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
router.post(
  '/:patientCode/prescriptions/:prescriptionId/whatsapp',
  postUploadedPrescriptionWhatsApp
);
router.delete(
  '/:patientCode/prescriptions/:prescriptionId',
  deletePatientPrescriptionHandler
);
router.patch(
  '/:patientCode/insurance',
  validateRequest(patientInsuranceUpdateSchema),
  patchPatientInsurance
);
router.get('/:patientCode', getPatient);
router.post('/', validateRequest(adminCreatePatientSchema), postPatient);
router.patch('/:patientCode', validateRequest(adminUpdatePatientSchema), patchPatient);

export default router;
