import HmsPatient from '../../models/hmsPatient.model.js';
import PatientPrescription from '../../models/patientPrescription.model.js';
import HmsInvoice from '../../models/hmsInvoice.model.js';
import { ErrorMessages, PATIENT_MESSAGES } from '../../utils/constants.js';
import { resolvePatientEmail, maskEmail } from '../../utils/patientEmail.util.js';
import { fetchRawPdfStream } from '../../services/cloudinary.service.js';
import { isPrescriptionEmailEnabled, isInvoiceEmailEnabled } from '../../services/email/mail.config.js';
import { sendPrescriptionEmail } from '../../services/email/mailPrescription.service.js';
import { sendInvoiceEmail } from '../../services/email/mailInvoice.service.js';
import { generateStructuredPrescriptionPdf } from './hmsStructuredPrescription.service.js';

const loadPatient = async (patientCode) => {
  const patient = await HmsPatient.findOne({ patientCode, status: true });
  if (!patient) throw new Error(ErrorMessages.PATIENT_NOT_FOUND);
  return patient;
};

const requirePatientEmail = (patient) => {
  const email = resolvePatientEmail(patient);
  if (!email) throw new Error(PATIENT_MESSAGES.NO_EMAIL_ADDRESS);
  return email;
};

const streamToBuffer = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
};

export const sendStructuredPrescriptionEmail = async (
  patientCode,
  prescriptionCode,
  { audience = 'patient' } = {}
) => {
  if (!isPrescriptionEmailEnabled()) {
    throw new Error('Prescription email is not configured');
  }

  const patient = await loadPatient(patientCode);
  const email = requirePatientEmail(patient);

  const file = await generateStructuredPrescriptionPdf(patientCode, prescriptionCode, {
    includeCombination: audience !== 'patient',
  });

  await sendPrescriptionEmail(email, {
    patientName: patient.name,
    prescriptionLabel: prescriptionCode,
    attachmentBuffer: file.buffer,
    filename: file.filename,
    mimeType: file.mimeType,
  });

  return {
    sent: true,
    patientEmailMasked: maskEmail(email),
    prescriptionCode,
  };
};

export const sendUploadedPrescriptionEmail = async (patientCode, prescriptionId) => {
  if (!isPrescriptionEmailEnabled()) {
    throw new Error('Prescription email is not configured');
  }

  const patient = await loadPatient(patientCode);
  const email = requirePatientEmail(patient);

  const doc = await PatientPrescription.findOne({
    _id: prescriptionId,
    patientCode,
    status: true,
  });
  if (!doc) throw new Error(PATIENT_MESSAGES.PRESCRIPTION_NOT_FOUND);

  const response = await fetchRawPdfStream(doc.cloudinaryPublicId, doc.cloudinaryUrl);
  const buffer = await streamToBuffer(response.data);

  await sendPrescriptionEmail(email, {
    patientName: patient.name,
    prescriptionLabel: doc.title || doc.fileName || 'Prescription',
    attachmentBuffer: buffer,
    filename: doc.fileName || 'prescription.pdf',
    mimeType: 'application/pdf',
  });

  return {
    sent: true,
    patientEmailMasked: maskEmail(email),
    prescriptionId,
  };
};

export const sendInvoiceEmailToPatient = async (
  invoiceCode,
  { documentBuffer, filename, mimeType } = {}
) => {
  if (!isInvoiceEmailEnabled()) {
    throw new Error('Invoice email is not configured');
  }

  const invoice = await HmsInvoice.findOne({ invoiceCode });
  if (!invoice) throw new Error('Invoice not found');

  const patient = await loadPatient(invoice.patientCode);
  const email = requirePatientEmail(patient);

  if (!documentBuffer) {
    throw new Error('Invoice document is required for email (PDF, JPG, or PNG)');
  }

  const balance = Math.max(0, invoice.amount - (invoice.amountPaid || 0));

  await sendInvoiceEmail(email, {
    patientName: patient.name,
    invoiceCode: invoice.invoiceCode,
    amount: String(Math.round(balance || invoice.amount)),
    attachmentBuffer: documentBuffer,
    filename: filename || `${invoiceCode}.pdf`,
    mimeType: mimeType || 'application/pdf',
  });

  return {
    sent: true,
    patientEmailMasked: maskEmail(email),
    invoiceCode,
  };
};
