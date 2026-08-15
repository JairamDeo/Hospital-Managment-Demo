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
import {
  assertStaffCanAccessPatient,
} from '../../utils/staffPatientScope.util.js';

export const getPatientStats = async (_req) => {
  const weekAgo = moment().subtract(7, 'days').startOf('day').toDate();
  const [total, newThisWeek] = await Promise.all([
    HmsPatient.countDocuments({}),
    HmsPatient.countDocuments({ createdAt: { $gte: weekAgo } }),
  ]);
  return { total, newThisWeek };
};

export const getPatientOverview = async (patientCode, req) => {
  await assertStaffCanAccessPatient(req, patientCode);

  const patient = await HmsPatient.findOne({ patientCode })
    .populate('prakriti', 'name')
    .populate('treatment', 'name');
  if (!patient) throw new Error(ErrorMessages.PATIENT_NOT_FOUND);

  const care = await PatientCareProfile.findOne({ patientCode });
  const formatted = formatHmsPatient(patient);
  const careData = formatPatientCare(care);
  const clinical = formatClinicalProfile(patient.clinicalProfile);

  let hmsAppts = await listAppointmentsByPatient(patientCode);
  if (req?.accountType === 'staff' && req.staff?.role === 'Doctor') {
    hmsAppts = hmsAppts.filter((a) => a.staffCode === req.staff.staffCode);
  }
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
