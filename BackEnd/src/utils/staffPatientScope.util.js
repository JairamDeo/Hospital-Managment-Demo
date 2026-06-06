import HmsAppointment from '../models/hmsAppointment.model.js';
import HmsPanchakarmaProgram from '../models/hmsPanchakarmaProgram.model.js';
import { ErrorMessages } from './constants.js';

/** Patient codes visible to Doctor (appointments) or Therapist (panchakarma programs). null = no filter. */
export const getStaffScopedPatientCodes = async (staff) => {
  if (!staff?.staffCode) return null;

  if (staff.role === 'Doctor') {
    return HmsAppointment.distinct('patientCode', {
      staffCode: staff.staffCode,
      status: { $ne: 'Cancelled' },
    });
  }

  if (staff.role === 'Therapist') {
    return HmsPanchakarmaProgram.distinct('patientCode', {
      staffCode: staff.staffCode,
      status: { $ne: 'Cancelled' },
    });
  }

  return null;
};

export const assertStaffCanAccessPatient = async (req, patientCode) => {
  if (req.accountType !== 'staff' || !req.staff) return;

  const allowed = await getStaffScopedPatientCodes(req.staff);
  if (allowed === null) return;

  if (!allowed.includes(patientCode)) {
    throw new Error(ErrorMessages.ACCESS_DENIED);
  }
};
