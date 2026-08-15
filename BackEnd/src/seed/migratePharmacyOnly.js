import { config } from 'dotenv';
import connectDB from '../config/db.js';
import { migratePharmacyItems } from './migratePharmacyItems.js';
import { logger } from '../utils/logger.js';

config();

const run = async () => {
  try {
    await connectDB();
    logger.info('Running pharmacy item migration (sale prices + legacy fields)…');
    await migratePharmacyItems();
    logger.info('Pharmacy migration completed');
    process.exit(0);
  } catch (error) {
    logger.error('Pharmacy migration failed:', error);
    process.exit(1);
  }
};

run();
