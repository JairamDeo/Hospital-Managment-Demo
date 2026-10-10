import { config } from 'dotenv';
config();
import connectDB from '../src/config/db.js';
import { getPatientCodePrefix } from '../src/utils/clinicSettings.util.js';
import { reassignAllPatientCodes } from '../src/admin/services/clinicSettings.service.js';

await connectDB();

const prefix = await getPatientCodePrefix();
const count = await reassignAllPatientCodes(prefix);

console.log(`Reassigned ${count} patient code(s) to {PREFIX}-MM-YY/0001 (prefix=${prefix})`);
process.exit(0);
