import HmsStaff from '../models/hmsStaff.model.js';
import { logger } from '../utils/logger.js';
import {
  STAFF_DEFAULT_PASSWORD,
  staffEmailFromName,
} from '../utils/staffCredentials.util.js';

export { staffEmailFromName, STAFF_DEFAULT_PASSWORD };

const SEED_STAFF = [
  // Doctors (3)
  {
    staffCode: 'STF-001',
    name: 'Dr. Ananya Sharma',
    role: 'Doctor',
    title: 'Chief Physician · OPD',
    dutyStatus: 'On Duty',
    statPrimaryValue: 284,
    statPrimaryLabel: 'Patients',
    todayCount: 12,
    rating: 4.9,
    tags: ['Panchakarma', 'Prakriti'],
    shift: '9AM – 5PM',
  },
  {
    staffCode: 'STF-007',
    name: 'Dr. Vijay Patel',
    role: 'Doctor',
    title: 'Senior Physician · IPD',
    dutyStatus: 'On Duty',
    statPrimaryValue: 210,
    statPrimaryLabel: 'Patients',
    todayCount: 9,
    rating: 4.7,
    tags: ['IPD', 'Follow-up'],
    shift: '9AM – 5PM',
  },
  {
    staffCode: 'STF-008',
    name: 'Dr. Meera Joshi',
    role: 'Doctor',
    title: 'Diet & Lifestyle Consultant',
    dutyStatus: 'On Duty',
    statPrimaryValue: 175,
    statPrimaryLabel: 'Patients',
    todayCount: 7,
    rating: 4.8,
    tags: ['Diet', 'Prakriti'],
    shift: '10AM – 4PM',
  },
  // Therapists (3)
  {
    staffCode: 'STF-002',
    name: 'Dr. Rekha Nair',
    role: 'Therapist',
    title: 'Vamana Specialist',
    dutyStatus: 'On Duty',
    statPrimaryValue: 196,
    statPrimaryLabel: 'Patients',
    todayCount: 8,
    rating: 4.8,
    tags: ['Vamana', 'Virechana'],
    shift: '9AM – 6PM',
  },
  {
    staffCode: 'STF-003',
    name: 'Dr. Sanjay Mehta',
    role: 'Therapist',
    title: 'Basti Therapist',
    dutyStatus: 'On Duty',
    statPrimaryValue: 148,
    statPrimaryLabel: 'Patients',
    todayCount: 6,
    rating: 4.7,
    tags: ['Basti', 'Shodhana'],
    shift: '10AM – 6PM',
  },
  {
    staffCode: 'STF-004',
    name: 'Dr. Kavita Rao',
    role: 'Therapist',
    title: 'Nasya Specialist',
    dutyStatus: 'On Duty',
    statPrimaryValue: 120,
    statPrimaryLabel: 'Patients',
    todayCount: 5,
    rating: 4.6,
    tags: ['Nasya', 'Shirodhara'],
    shift: '11AM – 7PM',
  },
  // Support (3)
  {
    staffCode: 'STF-006',
    name: 'Amit Verma',
    role: 'Support',
    title: 'Reception Lead',
    dutyStatus: 'On Duty',
    statPrimaryValue: 184,
    statPrimaryLabel: 'Handled',
    todayCount: 24,
    rating: 4.9,
    tags: ['Front Desk', 'Billing'],
    shift: '8AM – 5PM',
  },
  {
    staffCode: 'STF-016',
    name: 'Suresh Iyer',
    role: 'Support',
    title: 'Billing Executive',
    dutyStatus: 'On Duty',
    statPrimaryValue: 156,
    statPrimaryLabel: 'Handled',
    todayCount: 20,
    rating: 4.8,
    tags: ['Billing', 'Insurance'],
    shift: '9AM – 5PM',
  },
  {
    staffCode: 'STF-017',
    name: 'Pooja Nair',
    role: 'Support',
    title: 'Front Desk Associate',
    dutyStatus: 'On Duty',
    statPrimaryValue: 142,
    statPrimaryLabel: 'Handled',
    todayCount: 18,
    rating: 4.7,
    tags: ['Appointments', 'Enquiry'],
    shift: '8AM – 4PM',
  },
];

const SEED_STAFF_CODES = SEED_STAFF.map((row) => row.staffCode);

/** Remove staff not in the seed list (run via npm run seed). */
export const pruneExtraStaff = async () => {
  const result = await HmsStaff.deleteMany({ staffCode: { $nin: SEED_STAFF_CODES } });
  if (result.deletedCount) {
    logger.info(`Removed ${result.deletedCount} staff not in seed list`);
  }
  return result.deletedCount;
};

/** Ensure every staff row can log in with email + STAFF_DEFAULT_PASSWORD */
export const syncAllStaffCredentials = async () => {
  const allStaff = await HmsStaff.find({ status: true });
  let synced = 0;

  for (const member of allStaff) {
    member.email = staffEmailFromName(member.name);
    member.set('password', STAFF_DEFAULT_PASSWORD);
    await member.save();
    synced += 1;
  }

  logger.info(
    `Staff login credentials synced: ${synced} staff · password "${STAFF_DEFAULT_PASSWORD}"`
  );
  return synced;
};

export const seedHmsStaff = async () => {
  await pruneExtraStaff();

  let created = 0;
  let updated = 0;

  for (const row of SEED_STAFF) {
    const existing = await HmsStaff.findOne({ staffCode: row.staffCode });
    const payload = {
      ...row,
      email: staffEmailFromName(row.name),
      password: STAFF_DEFAULT_PASSWORD,
      todayLabel: 'Today',
      status: true,
    };

    if (existing) {
      existing.set(payload);
      existing.set('password', STAFF_DEFAULT_PASSWORD);
      await existing.save();
      updated += 1;
    } else {
      await HmsStaff.create(payload);
      created += 1;
    }
  }

  await syncAllStaffCredentials();

  logger.info(`HMS staff seed: ${created} created, ${updated} updated (${SEED_STAFF.length} total)`);
};
