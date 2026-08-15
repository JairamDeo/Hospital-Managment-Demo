import HmsStructuredPrescription from '../../models/hmsStructuredPrescription.model.js';
import HmsPatient from '../../models/hmsPatient.model.js';
import PatientPrescription from '../../models/patientPrescription.model.js';
import HmsInvoice from '../../models/hmsInvoice.model.js';
import { ErrorMessages, PATIENT_MESSAGES } from '../../utils/constants.js';
import { resolvePatientWhatsAppNumber, maskWhatsAppNumber } from '../../utils/patientWhatsApp.util.js';
import { uploadWhatsAppMedia } from '../../services/cloudinary.service.js';
import { isCloudinaryConfigured } from '../../config/cloudinary.config.js';
import {
  isPrescriptionWhatsAppEnabled,
  isInvoiceWhatsAppEnabled,
  sendPrescriptionDocumentWhatsApp,
  sendInvoiceDocumentWhatsApp,
} from '../../services/sms/foxgloveWhatsApp.service.js';
import { generateStructuredPrescriptionPdf } from './hmsStructuredPrescription.service.js';

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

const loadPatient = async (patientCode) => {
  const patient = await HmsPatient.findOne({ patientCode, status: true });
  if (!patient) throw new Error(ErrorMessages.PATIENT_NOT_FOUND);
  return patient;
};

const requireWhatsAppNumber = (patient) => {
  const wa = resolvePatientWhatsAppNumber(patient);
  if (!wa) throw new Error(PATIENT_MESSAGES.NO_WHATSAPP_NUMBER);
  return wa;
};

export const sendStructuredPrescriptionWhatsApp = async (
  patientCode,
  prescriptionCode,
  { audience = 'patient', req = null } = {}
) => {
  if (!isPrescriptionWhatsAppEnabled()) {
    throw new Error('Prescription WhatsApp template is not configured');
  }
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Add CLOUDINARY_* variables to .env');
  }

  const prescription = await HmsStructuredPrescription.findOne({ patientCode, prescriptionCode });
  if (!prescription) throw new Error(PATIENT_MESSAGES.PRESCRIPTION_NOT_FOUND);
  if (prescription.whatsappSentAt) {
    throw new Error(PATIENT_MESSAGES.WHATSAPP_ALREADY_SENT);
  }

  const patient = await loadPatient(patientCode);
  const whatsappNumber = requireWhatsAppNumber(patient);

  const file = await generateStructuredPrescriptionPdf(patientCode, prescriptionCode, {
    includeCombination: audience !== 'patient',
  });

  const upload = await uploadWhatsAppMedia(file.buffer, {
    patientCode,
    filename: file.filename,
    mimeType: file.mimeType,
  });

  const documentUrl = upload.secure_url;
  if (!documentUrl) throw new Error('Could not prepare prescription document for WhatsApp');

  await sendPrescriptionDocumentWhatsApp(whatsappNumber, {
    patientName: patient.name,
    prescriptionLabel: prescriptionCode,
    documentUrl,
    filename: file.filename,
  });

  prescription.whatsappSentAt = new Date();
  prescription.whatsappSentBy = performerFromReq(req);
  await prescription.save();

  return {
    sent: true,
    alreadySent: false,
    patientMobileMasked: maskWhatsAppNumber(whatsappNumber),
    prescriptionCode,
    whatsappSentAt: prescription.whatsappSentAt,
  };
};

export const sendUploadedPrescriptionWhatsApp = async (patientCode, prescriptionId) => {
  if (!isPrescriptionWhatsAppEnabled()) {
    throw new Error('Prescription WhatsApp template is not configured');
  }

  const patient = await loadPatient(patientCode);
  const whatsappNumber = requireWhatsAppNumber(patient);

  const doc = await PatientPrescription.findOne({
    _id: prescriptionId,
    patientCode,
    status: true,
  });
  if (!doc) throw new Error(PATIENT_MESSAGES.PRESCRIPTION_NOT_FOUND);

  const documentUrl = doc.cloudinaryUrl;
  if (!documentUrl) throw new Error('Prescription file URL not available');

  await sendPrescriptionDocumentWhatsApp(whatsappNumber, {
    patientName: patient.name,
    prescriptionLabel: doc.title || doc.fileName || 'Prescription',
    documentUrl,
    filename: doc.fileName || 'prescription.pdf',
  });

  return {
    sent: true,
    patientMobileMasked: maskWhatsAppNumber(whatsappNumber),
    prescriptionId,
  };
};

export const sendInvoiceWhatsApp = async (invoiceCode, { documentBuffer, filename, mimeType } = {}) => {
  if (!isInvoiceWhatsAppEnabled()) {
    throw new Error('Invoice WhatsApp template is not configured');
  }

  const invoice = await HmsInvoice.findOne({ invoiceCode });
  if (!invoice) throw new Error('Invoice not found');

  const patient = await loadPatient(invoice.patientCode);
  const whatsappNumber = requireWhatsAppNumber(patient);

  let documentUrl = '';
  let fileName = filename || `${invoiceCode}.pdf`;
  let fileMime = mimeType || 'application/pdf';

  if (documentBuffer) {
    if (!isCloudinaryConfigured()) {
      throw new Error('Cloudinary is not configured. Add CLOUDINARY_* variables to .env');
    }
    const upload = await uploadWhatsAppMedia(documentBuffer, {
      patientCode: invoice.patientCode,
      filename: fileName,
      mimeType: fileMime,
    });
    documentUrl = upload.secure_url;
  }

  if (!documentUrl) {
    throw new Error('Invoice document is required for WhatsApp (upload PDF, JPG, or PNG)');
  }

  await sendInvoiceDocumentWhatsApp(whatsappNumber, {
    patientName: patient.name,
    invoiceCode: invoice.invoiceCode,
    amount: String(Math.round(invoice.amount - (invoice.amountPaid || 0) || invoice.amount)),
    documentUrl,
    filename: fileName,
    mimeType: fileMime,
  });

  return {
    sent: true,
    patientMobileMasked: maskWhatsAppNumber(whatsappNumber),
    invoiceCode,
  };
};
