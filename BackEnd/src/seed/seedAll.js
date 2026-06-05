import { config } from 'dotenv';
import connectDB from '../config/db.js';
import { seedAdminUser } from '../admin/services/admin.service.js';
import { seedMastersIfEmpty } from './seedMasters.js';
import { seedPharmacyIfEmpty } from './seedPharmacy.js';
import { migratePharmacyItems } from './migratePharmacyItems.js';
import { seedHmsPatients } from './seedHmsPatients.js';
import { seedHmsStaff } from './seedHmsStaff.js';
import { purgePharmacistRole } from './purgePharmacistRole.js';
import { seedStaffActivityIfEmpty } from './seedStaffActivity.js';
import { seedHmsPanchakarma } from './seedHmsPanchakarma.js';
import { seedRbacIfEmpty } from '../utils/rbac.service.js';
import { logger } from '../utils/logger.js';

config();

const run = async () => {
  try {
    await connectDB();

    logger.info('Starting database seed…');
    await seedAdminUser();
    await seedMastersIfEmpty();
    await seedPharmacyIfEmpty();
    await migratePharmacyItems();
    await seedHmsPatients();
    await purgePharmacistRole();
    await seedHmsStaff();
    await seedStaffActivityIfEmpty();
    await seedHmsPanchakarma();
    await seedRbacIfEmpty();
    logger.info('Database seed completed');

    process.exit(0);
  } catch (error) {
    logger.error('Database seed failed:', error);
    process.exit(1);
  }
};

run();
