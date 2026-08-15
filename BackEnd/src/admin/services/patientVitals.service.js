import moment from 'moment';
import PatientCareProfile from '../../models/patientCareProfile.model.js';
import HmsPatient from '../../models/hmsPatient.model.js';
import { ErrorMessages } from '../../utils/constants.js';

export const addPatientVitals = async (patientCode, payload, req) => {
  const patient = await HmsPatient.findOne({ patientCode, status: true });
  if (!patient) throw new Error(ErrorMessages.PATIENT_NOT_FOUND);

  const care =
    (await PatientCareProfile.findOne({ patientCode })) ??
    (await PatientCareProfile.create({ patientCode, patient: patient._id }));

  const recordedByName =
    req.accountType === 'admin'
      ? req.admin?.firstName
        ? `${req.admin.firstName} ${req.admin.lastName || ''}`.trim()
        : 'Admin'
      : req.staff?.name || 'Staff';

  const entry = {
    recordedAt: new Date(),
    recordedByName,
    date: moment().format('DD-MMM-YYYY'),
    bp: payload.bp?.trim() || '',
    pulse: payload.pulse?.trim() || '',
    spo2: payload.spo2?.trim() || '',
    fasting: payload.fasting?.trim() || '',
    postMeal: payload.postMeal?.trim() || '',
    random: payload.random?.trim() || '',
    weight: payload.weight?.trim() || '',
  };

  care.vitalsHistory.unshift(entry);
  care.vitals = {
    temp: care.vitals?.temp || '—',
    bp: entry.bp || care.vitals?.bp || '—',
    pulse: entry.pulse || care.vitals?.pulse || '—',
    spo2: entry.spo2 || care.vitals?.spo2 || '—',
    bmi: entry.weight || care.vitals?.bmi || '—',
  };

  await care.save();

  return {
    vitalsHistory: care.vitalsHistory.map((v, index) => ({
      id: String(v._id ?? `vh-${index}`),
      date: v.date,
      bp: v.bp,
      pulse: v.pulse,
      spo2: v.spo2,
      fasting: v.fasting,
      postMeal: v.postMeal,
      random: v.random,
      weight: v.weight,
      recordedByName: v.recordedByName,
    })),
  };
};

export const listPatientVitalsHistory = async (patientCode) => {
  const care = await PatientCareProfile.findOne({ patientCode }).lean();
  return (care?.vitalsHistory ?? []).map((v, index) => ({
    id: String(v._id ?? `vh-${index}`),
    date: v.date,
    bp: v.bp,
    pulse: v.pulse,
    spo2: v.spo2,
    fasting: v.fasting,
    postMeal: v.postMeal,
    random: v.random,
    weight: v.weight,
    recordedByName: v.recordedByName,
  }));
};
