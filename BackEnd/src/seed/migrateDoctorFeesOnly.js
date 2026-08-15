import { config } from 'dotenv';
import connectDB from '../config/db.js';
import { migrateDoctorConsultationFees } from './migrateDoctorFees.js';
import { logger } from '../utils/logger.js';

config();

const run = async () => {
  try {
    await connectDB();
    logger.info('Running doctor consultation fee migration…');
    await migrateDoctorConsultationFees();
    logger.info('Doctor fee migration completed');
    process.exit(0);
  } catch (error) {
    logger.error('Doctor fee migration failed:', error);
    process.exit(1);
  }
};

run();
