import HmsPatient from '../../models/hmsPatient.model.js';
import HmsAppointment from '../../models/hmsAppointment.model.js';
import HmsInvoice from '../../models/hmsInvoice.model.js';
import HmsStructuredPrescription from '../../models/hmsStructuredPrescription.model.js';
import PatientPrescription from '../../models/patientPrescription.model.js';
import HmsLabOrder from '../../models/hmsLabOrder.model.js';
import HmsLabReport from '../../models/hmsLabReport.model.js';
import HmsIpdAdmission from '../../models/hmsIpdAdmission.model.js';
import HmsPanchakarmaProgram from '../../models/hmsPanchakarmaProgram.model.js';
import HmsNotification from '../../models/hmsNotification.model.js';
import HmsRazorpayPayment from '../../models/hmsRazorpayPayment.model.js';
import ConsultationAiSummary from '../../models/consultationAiSummary.model.js';
import PatientCareProfile from '../../models/patientCareProfile.model.js';
import {
  buildPatientCode,
  getClinicSettings,
  normalizePatientCodePrefix,
  previewPatientCodeFormat,
} from '../../utils/clinicSettings.util.js';

const RELATED_MODELS = [
  PatientCareProfile,
  HmsAppointment,
  HmsInvoice,
  HmsStructuredPrescription,
  PatientPrescription,
  HmsLabOrder,
  HmsLabReport,
  HmsIpdAdmission,
  HmsPanchakarmaProgram,
  HmsNotification,
  HmsRazorpayPayment,
  ConsultationAiSummary,
];

const periodKey = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}-${yy}`;
};

const remapRelatedPatientCodes = async (oldCode, newCode) => {
  for (const model of RELATED_MODELS) {
    await model.updateMany({ patientCode: oldCode }, { $set: { patientCode: newCode } });
  }
  await HmsAppointment.updateMany(
    { 'createdBy.patientCode': oldCode },
    { $set: { 'createdBy.patientCode': newCode } }
  );
};

export const getClinicSettingsDto = async () => {
  const row = await getClinicSettings();
  const prefix = normalizePatientCodePrefix(row.patientCodePrefix);
  return {
    name: row.name,
    patientCodePrefix: prefix,
    patientCodeFormat: '{PREFIX}-0001/MM-YY',
    patientCodePreview: previewPatientCodeFormat(prefix),
  };
};

export const updateClinicSettings = async ({
  name,
  patientCodePrefix,
  applyToExistingPatients = true,
} = {}) => {
  const row = await getClinicSettings();
  if (name !== undefined) row.name = String(name).trim() || row.name;

  const nextPrefix = normalizePatientCodePrefix(
    patientCodePrefix !== undefined ? patientCodePrefix : row.patientCodePrefix
  );
  const prevPrefix = normalizePatientCodePrefix(row.patientCodePrefix);
  row.patientCodePrefix = nextPrefix;
  await row.save();

  let reassigned = 0;
  if (applyToExistingPatients) {
    reassigned = await reassignAllPatientCodes(nextPrefix);
  } else if (nextPrefix !== prevPrefix) {
    // Prefix changed — still reassign so old codes stay consistent with clinic prefix.
    reassigned = await reassignAllPatientCodes(nextPrefix);
  }

  return {
    ...(await getClinicSettingsDto()),
    reassignedPatients: reassigned,
  };
};

/**
 * Re-number all patients with PREFIX-###/MM-YY using each patient's createdAt month.
 */
export const reassignAllPatientCodes = async (prefixInput) => {
  const prefix = normalizePatientCodePrefix(prefixInput || (await getClinicSettings()).patientCodePrefix);
  const patients = await HmsPatient.find({})
    .sort({ createdAt: 1, _id: 1 })
    .select('_id patientCode createdAt');

  if (!patients.length) return 0;

  // Avoid unique conflicts: move to temporary codes first.
  for (let i = 0; i < patients.length; i += 1) {
    const tempCode = `__TMP__${String(i + 1).padStart(6, '0')}`;
    const oldCode = patients[i].patientCode;
    if (oldCode === tempCode) continue;
    await HmsPatient.updateOne({ _id: patients[i]._id }, { $set: { patientCode: tempCode } });
    await remapRelatedPatientCodes(oldCode, tempCode);
    patients[i].patientCode = tempCode;
  }

  const seqByPeriod = new Map();
  let reassigned = 0;

  for (const patient of patients) {
    const created = patient.createdAt ? new Date(patient.createdAt) : new Date();
    const period = periodKey(created);
    const seq = (seqByPeriod.get(period) || 0) + 1;
    seqByPeriod.set(period, seq);
    const newCode = buildPatientCode(prefix, seq, created);
    const oldTemp = patient.patientCode;
    await HmsPatient.updateOne({ _id: patient._id }, { $set: { patientCode: newCode } });
    await remapRelatedPatientCodes(oldTemp, newCode);
    reassigned += 1;
  }

  return reassigned;
};
