import HmsPatient from '../../models/hmsPatient.model.js';
import { PATIENT_MESSAGES } from '../../utils/constants.js';
import { ErrorMessages } from '../../utils/constants.js';
import { formatHmsPatient } from '../../utils/formatHmsPatient.js';
import { generateHmsPatientCode } from '../../utils/generateHmsPatientCode.js';
import {
  findHmsPatientById,
  findHmsPatientMany,
  findHmsPatientOne,
} from '../../utils/hmsPatientQuery.js';
import { assertStaffCanAccessPatient } from '../../utils/staffPatientScope.util.js';
import { assertUniquePatientContact } from '../../utils/patientContact.util.js';
import {
  formatClinicalProfile,
  mergeClinicalProfile,
} from '../../utils/patientClinical.util.js';

export const listPatients = async (req) => {
  const patients = await findHmsPatientMany({}).sort({ createdAt: -1 });
  return patients.map(formatHmsPatient);
};

export const getPatientByCode = async (patientCode, req) => {
  if (req) await assertStaffCanAccessPatient(req, patientCode);
  const patient = await findHmsPatientOne({ patientCode });
  if (!patient) return null;
  return formatHmsPatient(patient);
};

export const createPatientByAdmin = async (payload) => {
  const { mobileNumber, email } = await assertUniquePatientContact({
    mobileNumber: payload.mobileNumber,
    email: payload.email,
  });

  const patient = await HmsPatient.create({
    patientCode: await generateHmsPatientCode(),
    name: payload.name.trim(),
    email,
    mobileNumber,
    age: payload.age,
    prakriti: payload.prakritiId || null,
    treatment: payload.treatmentId || null,
    lastVisit: payload.lastVisit ? new Date(payload.lastVisit) : new Date(),
    recordStatus: payload.recordStatus || 'Active',
    createdByAdmin: true,
    status: true,
  });

  const populated = await findHmsPatientById(patient._id);
  return formatHmsPatient(populated);
};

export const updatePatientByAdmin = async (patientCode, payload, req) => {
  if (req) await assertStaffCanAccessPatient(req, patientCode);
  const patient = await HmsPatient.findOne({ patientCode });
  if (!patient) throw new Error(ErrorMessages.PATIENT_NOT_FOUND);

  const mobileInput =
    payload.mobileNumber !== undefined ? payload.mobileNumber : patient.mobileNumber;
  const emailInput = payload.email !== undefined ? payload.email : patient.email;

  const { mobileNumber, email } = await assertUniquePatientContact({
    mobileNumber: mobileInput,
    email: emailInput,
    excludePatientId: patient._id,
  });

  if (payload.name !== undefined) patient.name = payload.name.trim();
  if (payload.age !== undefined) patient.age = payload.age;
  if (payload.gender !== undefined) patient.gender = payload.gender;
  if (payload.bloodGroup !== undefined) patient.bloodGroup = String(payload.bloodGroup).trim();
  if (payload.city !== undefined) patient.city = String(payload.city).trim() || 'India';
  if (payload.prakritiId !== undefined) patient.prakriti = payload.prakritiId || null;
  if (payload.treatmentId !== undefined) patient.treatment = payload.treatmentId;
  if (payload.recordStatus !== undefined) patient.recordStatus = payload.recordStatus;
  if (payload.lastVisit !== undefined) patient.lastVisit = new Date(payload.lastVisit);

  patient.mobileNumber = mobileNumber;
  patient.email = email;

  await patient.save();
  const populated = await findHmsPatientById(patient._id);
  return formatHmsPatient(populated);
};

export const getPatientClinicalByCode = async (patientCode, req) => {
  await assertStaffCanAccessPatient(req, patientCode);
  const patient = await HmsPatient.findOne({ patientCode }).select('clinicalProfile patientCode');
  if (!patient) throw new Error(ErrorMessages.PATIENT_NOT_FOUND);
  return {
    patientCode: patient.patientCode,
    clinical: formatClinicalProfile(patient.clinicalProfile),
  };
};

export const updatePatientClinicalByCode = async (patientCode, payload, req) => {
  await assertStaffCanAccessPatient(req, patientCode);
  const patient = await HmsPatient.findOne({ patientCode });
  if (!patient) throw new Error(ErrorMessages.PATIENT_NOT_FOUND);

  patient.clinicalProfile = mergeClinicalProfile(patient.clinicalProfile, payload);
  patient.markModified('clinicalProfile');
  await patient.save();

  return {
    patientCode: patient.patientCode,
    clinical: formatClinicalProfile(patient.clinicalProfile),
  };
};
