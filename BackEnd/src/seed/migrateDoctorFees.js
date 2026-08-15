import HmsStaff from '../models/hmsStaff.model.js';
import { logger } from '../utils/logger.js';

/** Default consultation fee (same for new visit and follow-up). */
export const DEFAULT_DOCTOR_CONSULTATION_FEE = 500;

/** Known seed doctors — used when backfilling empty fees. */
export const DOCTOR_FEE_BY_STAFF_CODE = {
  'STF-001': 600,
  'STF-007': 500,
  'STF-008': 450,
};

/** Set consultationFee on all doctors missing one; remove legacy followUpFee. Run via npm run seed. */
export const migrateDoctorConsultationFees = async () => {
  const doctors = await HmsStaff.find({ role: 'Doctor' });
  let updated = 0;

  for (const doctor of doctors) {
    const update = {};
    const current = Number(doctor.consultationFee) || 0;
    const legacyFollowUp = Number(doctor.followUpFee) || 0;

    if (current <= 0) {
      const fee =
        DOCTOR_FEE_BY_STAFF_CODE[doctor.staffCode] ??
        (legacyFollowUp > 0 ? legacyFollowUp : DEFAULT_DOCTOR_CONSULTATION_FEE);
      update.consultationFee = fee;
    }

    await HmsStaff.updateOne(
      { _id: doctor._id },
      {
        ...(Object.keys(update).length ? { $set: update } : {}),
        $unset: { followUpFee: 1 },
      }
    );

    if (Object.keys(update).length) updated += 1;
  }

  if (updated > 0) {
    logger.info(`Doctor consultation fees: updated ${updated} doctor(s)`);
  } else {
    logger.info('Doctor consultation fees: all doctors already have fees');
  }
};
