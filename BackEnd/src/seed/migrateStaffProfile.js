import { config } from 'dotenv';
import connectDB from '../config/db.js';
import HmsStaff from '../models/hmsStaff.model.js';
import { logger } from '../utils/logger.js';

config();

const DEFAULTS_BY_ROLE = {
  Doctor: {
    qualifications: [
      { level: 'UG', degree: 'BAMS' },
      { level: 'PG', degree: 'MD (Ayurveda)' },
    ],
    registrationNumber: 'I-8874-A',
  },
  Therapist: {
    qualifications: [
      { level: 'Diploma', degree: 'DPC' },
      { level: 'Certificate', degree: 'Panchakarma Therapy' },
    ],
    registrationNumber: 'TH-4521-B',
  },
  Support: {
    qualifications: [{ level: 'Other', degree: 'Hospital Administration' }],
    registrationNumber: '',
  },
};

export const migrateStaffProfessionalFields = async () => {
  const staff = await HmsStaff.find({});
  let updated = 0;

  for (const member of staff) {
    let changed = false;
    const defaults = DEFAULTS_BY_ROLE[member.role] || DEFAULTS_BY_ROLE.Support;

    if (!member.qualifications?.length) {
      member.qualifications = defaults.qualifications;
      changed = true;
    }

    if (!member.registrationNumber?.trim()) {
      if (['Doctor', 'Therapist'].includes(member.role)) {
        member.registrationNumber = `${defaults.registrationNumber}-${member.staffCode.slice(-3)}`;
        changed = true;
      }
    }

    if (!member.aadharNumber?.trim()) {
      const suffix = member.staffCode.replace(/\D/g, '').padStart(4, '0').slice(-4);
      member.aadharNumber = `12345678${suffix}`.slice(0, 12);
      changed = true;
    }

    if (!member.panNumber?.trim()) {
      const code = member.staffCode.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(-4);
      member.panNumber = `ABCDE${code.slice(0, 4)}F`.slice(0, 10);
      changed = true;
    }

    if (changed) {
      await member.save();
      updated += 1;
    }
  }

  logger.info(`Staff professional fields migration: ${updated} updated (${staff.length} total)`);
  return updated;
};

const run = async () => {
  try {
    await connectDB();
    await migrateStaffProfessionalFields();
    process.exit(0);
  } catch (error) {
    logger.error('Staff migration failed:', error);
    process.exit(1);
  }
};

if (process.argv[1]?.includes('migrateStaffProfile')) {
  run();
}
