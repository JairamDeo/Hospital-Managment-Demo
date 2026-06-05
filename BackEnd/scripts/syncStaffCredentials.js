import dotenv from 'dotenv';
import mongoose from 'mongoose';
import HmsStaff from '../src/models/hmsStaff.model.js';
import {
  syncAllStaffCredentials,
  STAFF_DEFAULT_PASSWORD,
} from '../src/seed/seedHmsStaff.js';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await syncAllStaffCredentials();

  const sample = await HmsStaff.findOne({ staffCode: 'STF-001' });
  const ok = sample ? await sample.comparePassword(STAFF_DEFAULT_PASSWORD) : false;

  const total = await HmsStaff.countDocuments({ status: true });
  const withEmail = await HmsStaff.countDocuments({
    status: true,
    email: { $exists: true, $nin: [null, ''] },
  });

  console.log(`Synced ${total} staff`);
  console.log(`STF-001: ${sample?.email} · password OK: ${ok}`);
  console.log(`Staff with email: ${withEmail}/${total}`);

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
