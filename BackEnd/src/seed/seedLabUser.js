import { config } from 'dotenv';
import connectDB from '../config/db.js';
import HmsStaff from '../models/hmsStaff.model.js';
import { mergeRbacDefaults } from '../utils/rbac.service.js';

config();

const EMAIL = 'lab1@ayurvedahealth.com';
const PASSWORD = 'Admin@123';

const run = async () => {
  await connectDB();
  await mergeRbacDefaults();

  const existing = await HmsStaff.findOne({
    $or: [{ email: EMAIL }, { staffCode: 'STF-010' }],
  });

  if (existing) {
    existing.name = 'Lab User One';
    existing.role = 'Lab';
    existing.title = 'Lab Technician';
    existing.email = EMAIL;
    existing.staffCode = existing.staffCode || 'STF-010';
    existing.dutyStatus = 'On Duty';
    existing.status = true;
    existing.tags = ['Lab', 'Diagnostics'];
    existing.shift = '9AM – 5PM';
    existing.set('password', PASSWORD);
    await existing.save();
    console.log(`Updated Lab user: ${EMAIL} / ${PASSWORD} (staffCode ${existing.staffCode})`);
  } else {
    const created = await HmsStaff.create({
      staffCode: 'STF-010',
      name: 'Lab User One',
      role: 'Lab',
      title: 'Lab Technician',
      email: EMAIL,
      password: PASSWORD,
      dutyStatus: 'On Duty',
      status: true,
      tags: ['Lab', 'Diagnostics'],
      shift: '9AM – 5PM',
      todayLabel: 'Today',
      statPrimaryLabel: 'Reports',
    });
    console.log(`Created Lab user: ${EMAIL} / ${PASSWORD} (staffCode ${created.staffCode})`);
  }

  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
