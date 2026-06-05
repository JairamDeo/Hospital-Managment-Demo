import moment from 'moment';
import HmsPatient from '../../models/hmsPatient.model.js';
import PatientCareProfile from '../../models/patientCareProfile.model.js';
import { ErrorMessages } from '../../utils/constants.js';
import { formatHmsPatient } from '../../utils/formatHmsPatient.js';
import { formatPatientCare } from '../../utils/formatPatientCare.js';
import { formatClinicalProfile } from '../../utils/patientClinical.util.js';
import {
  listAppointmentsByPatient,
  mapHmsToPatientCareAppointment,
} from './hmsAppointment.service.js';
import { listInvoicesByPatient } from './hmsBilling.service.js';
import { mapInvoiceToPatientCare } from '../../utils/formatHmsInvoice.js';

export const getPatientStats = async () => {
  const total = await HmsPatient.countDocuments({ status: true });
  const weekAgo = moment().subtract(7, 'days').startOf('day').toDate();
  const newThisWeek = await HmsPatient.countDocuments({
    status: true,
    createdAt: { $gte: weekAgo },
  });
  return { total, newThisWeek };
};

export const getPatientOverview = async (patientCode) => {
  const patient = await HmsPatient.findOne({ patientCode })
    .populate('prakriti', 'name')
    .populate('treatment', 'name');
  if (!patient) throw new Error(ErrorMessages.PATIENT_NOT_FOUND);

  const care = await PatientCareProfile.findOne({ patientCode });
  const formatted = formatHmsPatient(patient);
  const careData = formatPatientCare(care);
  const clinical = formatClinicalProfile(patient.clinicalProfile);

  const hmsAppts = await listAppointmentsByPatient(patientCode);
  if (hmsAppts.length > 0) {
    careData.appointments = hmsAppts.map(mapHmsToPatientCareAppointment);
  }

  const hmsInvoices = await listInvoicesByPatient(patientCode);
  if (hmsInvoices.length > 0) {
    careData.invoices = hmsInvoices.map(mapInvoiceToPatientCare);
  }

  return {
    patient: {
      ...formatted,
      gender: patient.gender || 'Not recorded',
      bloodGroup: formatted.bloodGroup,
      city: formatted.city,
      memberSince: formatted.memberSince,
    },
    care: careData,
    clinical,
  };
};
