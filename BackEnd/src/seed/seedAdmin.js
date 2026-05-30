import { config } from 'dotenv';
import connectDB from '../config/db.js';
import { seedAdminUser } from '../admin/services/admin.service.js';
import { logger } from '../utils/logger.js';

config();

const run = async () => {
  try {
    await connectDB();
    await seedAdminUser();
    logger.info('Admin seed completed');
    process.exit(0);
  } catch (error) {
    logger.error('Admin seed failed:', error);
    process.exit(1);
  }
};

run();
