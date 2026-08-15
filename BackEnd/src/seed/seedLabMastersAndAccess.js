import { config } from 'dotenv';
import connectDB from '../config/db.js';
import LabTestCategoryMaster from '../models/labTestCategoryMaster.model.js';
import LabTestMaster from '../models/labTestMaster.model.js';
import RbacRoleConfig from '../models/rbacRoleConfig.model.js';
import { DEFAULT_RBAC_BY_ROLE } from '../utils/rbacDefaults.js';

config();

const CATEGORIES = [
  {
    code: 'LTC-001',
    name: 'Diabetes',
    tests: [
      { code: 'LBT-001', name: 'Fasting Blood Sugar (FBS)' },
      { code: 'LBT-002', name: 'Postprandial Blood Sugar (PPBS)' },
      { code: 'LBT-003', name: 'HbA1c' },
    ],
  },
  {
    code: 'LTC-002',
    name: 'Thyroid',
    tests: [
      { code: 'LBT-004', name: 'TSH' },
      { code: 'LBT-005', name: 'T3 / T4' },
    ],
  },
  {
    code: 'LTC-003',
    name: 'Blood / CBC',
    tests: [
      { code: 'LBT-006', name: 'Complete Blood Count (CBC)' },
      { code: 'LBT-007', name: 'Lipid Profile' },
    ],
  },
];

const syncLabRbac = async () => {
  const existing = await RbacRoleConfig.findOne({ role: 'Lab' }).lean();
  if (existing) {
    console.log('Lab RBAC already present — left unchanged (admin settings persist)');
    return;
  }
  await RbacRoleConfig.create({ role: 'Lab', modules: DEFAULT_RBAC_BY_ROLE.Lab });
  console.log('Lab RBAC created from defaults: dashboard + lab');
};

const seedLabMasters = async () => {
  let categories = 0;
  let tests = 0;

  for (const cat of CATEGORIES) {
    let category = await LabTestCategoryMaster.findOne({ code: cat.code });
    if (!category) {
      category = await LabTestCategoryMaster.create({
        code: cat.code,
        name: cat.name,
        active: true,
      });
      categories += 1;
    } else {
      category.name = cat.name;
      category.active = true;
      await category.save();
    }

    for (const test of cat.tests) {
      const existing = await LabTestMaster.findOne({ code: test.code });
      if (!existing) {
        await LabTestMaster.create({
          code: test.code,
          name: test.name,
          category: category._id,
          categoryCode: category.code,
          categoryName: category.name,
          active: true,
        });
        tests += 1;
      } else {
        existing.name = test.name;
        existing.category = category._id;
        existing.categoryCode = category.code;
        existing.categoryName = category.name;
        existing.active = true;
        await existing.save();
      }
    }
  }

  console.log(`Lab masters: ${categories} categories created, ${tests} tests created (7 total tests)`);
};

export { seedLabMasters, syncLabRbac };

const run = async () => {
  await connectDB();
  await syncLabRbac();
  await seedLabMasters();
  process.exit(0);
};

const isDirectRun = process.argv[1] && process.argv[1].includes('seedLabMastersAndAccess');

if (isDirectRun) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}