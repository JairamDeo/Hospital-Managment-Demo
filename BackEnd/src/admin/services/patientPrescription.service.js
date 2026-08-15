import HmsPatient from '../../models/hmsPatient.model.js';
import PatientPrescription from '../../models/patientPrescription.model.js';
import { ErrorMessages } from '../../utils/constants.js';
import { formatPatientPrescription } from '../../utils/formatPatientPrescription.js';
import { prescriptionFolderForPatient } from '../../utils/cloudinaryFolders.util.js';
import { uploadPrescriptionPdf, deleteCloudinaryAsset } from '../../services/cloudinary.service.js';

const assertPatient = async (patientCode) => {
  const patient = await HmsPatient.findOne({ patientCode });
  if (!patient) throw new Error(ErrorMessages.PATIENT_NOT_FOUND);
  return patient;
};

export const listPatientPrescriptions = async (patientCode) => {
  await assertPatient(patientCode);
  const docs = await PatientPrescription.find({ patientCode, active: true })
    .sort({ createdAt: -1 })
    .lean();
  return docs.map(formatPatientPrescription);
};

export const uploadPatientPrescription = async (patientCode, file, title) => {
  const patient = await assertPatient(patientCode);
  if (!file?.buffer?.length) {
    throw new Error('PDF file is required');
  }

  const upload = await uploadPrescriptionPdf(file.buffer, {
    patientCode,
    originalName: file.originalname,
  });

  const doc = await PatientPrescription.create({
    patientCode,
    patient: patient._id,
    title: (title || file.originalname || 'Prescription').trim(),
    fileName: file.originalname,
    mimeType: file.mimetype || 'application/pdf',
    bytes: file.size ?? upload.bytes ?? 0,
    cloudinaryPublicId: upload.public_id,
    cloudinaryUrl: upload.secure_url,
    cloudinaryFolder: upload.folder || prescriptionFolderForPatient(patientCode),
  });

  return formatPatientPrescription(doc);
};

export const getPatientPrescriptionDoc = async (patientCode, prescriptionId) => {
  await assertPatient(patientCode);
  const doc = await PatientPrescription.findOne({
    _id: prescriptionId,
    patientCode,
    active: true,
  });
  if (!doc) throw new Error('Prescription not found');
  return doc;
};

export const deletePatientPrescription = async (patientCode, prescriptionId) => {
  await assertPatient(patientCode);
  const doc = await PatientPrescription.findOne({
    _id: prescriptionId,
    patientCode,
    active: true,
  });
  if (!doc) throw new Error('Prescription not found');

  try {
    await deleteCloudinaryAsset(doc.cloudinaryPublicId, 'raw');
  } catch {
    // Still soft-delete if Cloudinary asset already removed
  }

  doc.active = false;
  await doc.save();
  return { deleted: true };
};
