import { config } from 'dotenv';
config();
import connectDB from '../src/config/db.js';
import HmsAppointment from '../src/models/hmsAppointment.model.js';

await connectDB();

const r1 = await HmsAppointment.updateMany(
  { appointmentType: 'General Consult' },
  { $set: { appointmentType: 'Diet Consult' } }
);
const r2 = await HmsAppointment.updateMany(
  { consultationMode: { $exists: false } },
  { $set: { consultationMode: 'Offline' } }
);

console.log('type migrated', r1.modifiedCount, 'mode set', r2.modifiedCount);
process.exit(0);
