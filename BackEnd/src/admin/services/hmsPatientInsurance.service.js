import HmsPatient from '../../models/hmsPatient.model.js';
import { ErrorMessages } from '../../utils/constants.js';
import {
  formatPatientInsuranceRow,
  getInsuranceStats,
  normalizeInsurance,
} from '../../utils/patientInsurance.util.js';

export const listPatientInsurance = async () => {
  const patients = await HmsPatient.find({ status: true }).sort({ name: 1 });
  return patients.map(formatPatientInsuranceRow);
};

export const getPatientInsuranceStats = async () => {
  const rows = await listPatientInsurance();
  return getInsuranceStats(rows);
};

export const updatePatientInsurance = async (patientCode, payload) => {
  const patient = await HmsPatient.findOne({ patientCode, status: true });
  if (!patient) throw new Error(ErrorMessages.PATIENT_NOT_FOUND);

  patient.healthInsurance = normalizeInsurance(payload.insurance ?? payload);
  await patient.save();
  return formatPatientInsuranceRow(patient);
};
