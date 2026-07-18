import { config } from 'dotenv';
import connectDB from '../config/db.js';
import { seedAdminUser } from '../admin/services/admin.service.js';
import { seedMastersIfEmpty } from './seedMasters.js';
import { seedPharmacyIfEmpty } from './seedPharmacy.js';
import { migratePharmacyItems } from './migratePharmacyItems.js';
import { seedHmsStaff } from './seedHmsStaff.js';
import { migrateDoctorConsultationFees } from './migrateDoctorFees.js';
import { migrateStaffProfessionalFields } from './migrateStaffProfile.js';
import { purgePharmacistRole } from './purgePharmacistRole.js';
import { seedStaffActivityIfEmpty } from './seedStaffActivity.js';
import { seedHmsPanchakarma } from './seedHmsPanchakarma.js';
import { seedRbacIfEmpty, mergeRbacDefaults } from '../utils/rbac.service.js';
import { seedLabMasters } from './seedLabMastersAndAccess.js';
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
    await purgePharmacistRole();
    await seedHmsStaff();
    await migrateDoctorConsultationFees();
    await migrateStaffProfessionalFields();
    await seedStaffActivityIfEmpty();
    await seedHmsPanchakarma();
    await seedRbacIfEmpty();
    await mergeRbacDefaults();
    await seedLabMasters();
    logger.info('Database seed completed');

    process.exit(0);
  } catch (error) {
    logger.error('Database seed failed:', error);
    process.exit(1);
  }
};

run();
