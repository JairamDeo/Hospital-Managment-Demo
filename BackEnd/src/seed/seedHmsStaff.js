import HmsStaff from '../models/hmsStaff.model.js';
import { logger } from '../utils/logger.js';
import {
  STAFF_DEFAULT_PASSWORD,
  staffEmailFromName,
} from '../utils/staffCredentials.util.js';

export { staffEmailFromName, STAFF_DEFAULT_PASSWORD };

const SEED_STAFF = [
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
    dutyStatus: 'Off Duty',
    statPrimaryValue: 120,
    statPrimaryLabel: 'Patients',
    todayCount: 0,
    rating: 4.6,
    tags: ['Nasya', 'Shirodhara'],
    shift: 'Off today',
  },
  {
    staffCode: 'STF-005',
    name: 'Priya Desai',
    role: 'Pharmacist',
    title: 'Head Pharmacist',
    dutyStatus: 'On Duty',
    statPrimaryValue: 248,
    statPrimaryLabel: 'Dispensed',
    todayCount: 32,
    rating: 4.8,
    tags: ['Churna', 'Oil'],
    shift: '8AM – 4PM',
  },
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
  {
    staffCode: 'STF-009',
    name: 'Dr. Rahul Singh',
    role: 'Doctor',
    title: 'General Physician',
    dutyStatus: 'Off Duty',
    statPrimaryValue: 162,
    statPrimaryLabel: 'Patients',
    todayCount: 0,
    rating: 4.5,
    tags: ['OPD', 'Consult'],
    shift: 'Off today',
  },
  {
    staffCode: 'STF-010',
    name: 'Dr. Anita Roy',
    role: 'Doctor',
    title: 'Panchakarma Physician',
    dutyStatus: 'On Duty',
    statPrimaryValue: 198,
    statPrimaryLabel: 'Patients',
    todayCount: 10,
    rating: 4.9,
    tags: ['Panchakarma', 'Detox'],
    shift: '9AM – 6PM',
  },
  {
    staffCode: 'STF-011',
    name: 'Dr. Sunita Rao',
    role: 'Therapist',
    title: 'Shirodhara Specialist',
    dutyStatus: 'On Duty',
    statPrimaryValue: 132,
    statPrimaryLabel: 'Patients',
    todayCount: 5,
    rating: 4.7,
    tags: ['Shirodhara', 'Relaxation'],
    shift: '11AM – 7PM',
  },
  {
    staffCode: 'STF-012',
    name: 'Dr. Arjun Kapoor',
    role: 'Therapist',
    title: 'Virechana Therapist',
    dutyStatus: 'On Duty',
    statPrimaryValue: 115,
    statPrimaryLabel: 'Patients',
    todayCount: 4,
    rating: 4.6,
    tags: ['Virechana', 'Purgation'],
    shift: '9AM – 5PM',
  },
  {
    staffCode: 'STF-013',
    name: 'Neha Gupta',
    role: 'Pharmacist',
    title: 'Dispensing Pharmacist',
    dutyStatus: 'On Duty',
    statPrimaryValue: 186,
    statPrimaryLabel: 'Dispensed',
    todayCount: 28,
    rating: 4.7,
    tags: ['Tablets', 'Syrups'],
    shift: '9AM – 5PM',
  },
  {
    staffCode: 'STF-014',
    name: 'Rohit Malhotra',
    role: 'Pharmacist',
    title: 'Inventory Pharmacist',
    dutyStatus: 'On Duty',
    statPrimaryValue: 142,
    statPrimaryLabel: 'Dispensed',
    todayCount: 18,
    rating: 4.6,
    tags: ['Stock', 'Orders'],
    shift: '8AM – 4PM',
  },
  {
    staffCode: 'STF-015',
    name: 'Kavita Shah',
    role: 'Pharmacist',
    title: 'Herbal Formulations',
    dutyStatus: 'Off Duty',
    statPrimaryValue: 98,
    statPrimaryLabel: 'Dispensed',
    todayCount: 0,
    rating: 4.5,
    tags: ['Churna', 'Kashayam'],
    shift: 'Off today',
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
  {
    staffCode: 'STF-018',
    name: 'Manish Kumar',
    role: 'Support',
    title: 'Ward Coordinator',
    dutyStatus: 'On Duty',
    statPrimaryValue: 128,
    statPrimaryLabel: 'Handled',
    todayCount: 15,
    rating: 4.6,
    tags: ['Ward', 'IPD'],
    shift: '10AM – 6PM',
  },
  {
    staffCode: 'STF-019',
    name: 'Dr. Deepak Verma',
    role: 'Doctor',
    title: 'Ayurvedic Surgeon',
    dutyStatus: 'On Duty',
    statPrimaryValue: 188,
    statPrimaryLabel: 'Patients',
    todayCount: 8,
    rating: 4.8,
    tags: ['Surgery', 'Kshara'],
    shift: '9AM – 5PM',
  },
  {
    staffCode: 'STF-020',
    name: 'Dr. Lakshmi Menon',
    role: 'Doctor',
    title: 'Pediatric Ayurveda',
    dutyStatus: 'On Duty',
    statPrimaryValue: 145,
    statPrimaryLabel: 'Patients',
    todayCount: 6,
    rating: 4.9,
    tags: ['Pediatric', 'Immunity'],
    shift: '10AM – 4PM',
  },
  {
    staffCode: 'STF-021',
    name: 'Dr. Karan Desai',
    role: 'Therapist',
    title: 'Panchakarma Therapist',
    dutyStatus: 'Off Duty',
    statPrimaryValue: 108,
    statPrimaryLabel: 'Patients',
    todayCount: 0,
    rating: 4.5,
    tags: ['Panchakarma', 'Basti'],
    shift: 'Off today',
  },
  {
    staffCode: 'STF-022',
    name: 'Ritu Sharma',
    role: 'Support',
    title: 'Patient Care Assistant',
    dutyStatus: 'On Duty',
    statPrimaryValue: 112,
    statPrimaryLabel: 'Handled',
    todayCount: 14,
    rating: 4.7,
    tags: ['Care', 'Support'],
    shift: '9AM – 5PM',
  },
  {
    staffCode: 'STF-023',
    name: 'Dr. Harsh Patel',
    role: 'Doctor',
    title: 'Consulting Physician',
    dutyStatus: 'On Duty',
    statPrimaryValue: 167,
    statPrimaryLabel: 'Patients',
    todayCount: 7,
    rating: 4.6,
    tags: ['Consult', 'Diagnosis'],
    shift: '11AM – 7PM',
  },
  {
    staffCode: 'STF-024',
    name: 'Geeta Reddy',
    role: 'Support',
    title: 'Records & Admin',
    dutyStatus: 'Off Duty',
    statPrimaryValue: 96,
    statPrimaryLabel: 'Handled',
    todayCount: 0,
    rating: 4.5,
    tags: ['Records', 'Admin'],
    shift: 'Off today',
  },
];

/** Ensure every staff row can log in with email + STAFF_DEFAULT_PASSWORD */
export const syncAllStaffCredentials = async () => {
  const allStaff = await HmsStaff.find({ status: true });
  let synced = 0;

  for (const member of allStaff) {
    if (!member.email?.trim()) {
      member.email = staffEmailFromName(member.name);
    }
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
