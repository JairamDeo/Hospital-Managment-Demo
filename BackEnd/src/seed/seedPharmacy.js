import PharmacyCategoryMaster from '../models/pharmacyCategoryMaster.model.js';
import PharmacyUnitMaster from '../models/pharmacyUnitMaster.model.js';
import PharmacySpoonMaster from '../models/pharmacySpoonMaster.model.js';
import PharmacyItem from '../models/pharmacyItem.model.js';
import moment from 'moment';
import { generatePharmacyItemCode } from '../utils/generatePharmacyItemCode.js';
import { logger } from '../utils/logger.js';
import { PHARMACY_SEED_ITEMS } from './pharmacySeedDefaults.js';

const DEFAULT_CATEGORIES = [
  'Medicated Oil',
  'Adaptogen',
  'Herbal Formula',
  'Rasayana',
  'Herbal Extract',
  'Health Tonic',
];

/** Common pharmacy pack / measure units */
const DEFAULT_UNITS = [
  'mg',
  'g',
  'kg',
  'ml',
  'L',
  'tablet',
  'capsule',
  'strip',
  'sachet',
  'bottle',
  'vial',
  'ampoule',
  'drop',
  'unit',
];

const DEFAULT_ITEMS = PHARMACY_SEED_ITEMS;

const nextCategoryCode = async () => {
  const count = await PharmacyCategoryMaster.countDocuments();
  return `PHC-${String(count + 1).padStart(3, '0')}`;
};

const nextUnitCode = async () => {
  const count = await PharmacyUnitMaster.countDocuments();
  return `PHU-${String(count + 1).padStart(3, '0')}`;
};

const DEFAULT_SPOONS = [
  { name: '1 gram spoon', grams: 1, isDefault: false },
  { name: '1.5 gram spoon', grams: 1.5, isDefault: true },
];

export const seedPharmacyIfEmpty = async () => {
  const spoonCount = await PharmacySpoonMaster.countDocuments();
  if (spoonCount === 0) {
    for (let i = 0; i < DEFAULT_SPOONS.length; i += 1) {
      await PharmacySpoonMaster.create({
        code: `PHS-${String(i + 1).padStart(3, '0')}`,
        ...DEFAULT_SPOONS[i],
      });
    }
    logger.info('Seeded default pharmacy spoon sizes');
  }

  const unitCount = await PharmacyUnitMaster.countDocuments();
  if (unitCount === 0) {
    for (const name of DEFAULT_UNITS) {
      const code = await nextUnitCode();
      await PharmacyUnitMaster.create({ code, name });
    }
    logger.info('Seeded default pharmacy units');
  }

  const categoryCount = await PharmacyCategoryMaster.countDocuments();
  if (categoryCount === 0) {
    for (const name of DEFAULT_CATEGORIES) {
      const code = await nextCategoryCode();
      await PharmacyCategoryMaster.create({ code, name });
    }
    logger.info('Seeded default pharmacy categories');
  }

  const itemCount = await PharmacyItem.countDocuments();
  if (itemCount > 0) return;

  const categories = await PharmacyCategoryMaster.find().lean();
  const units = await PharmacyUnitMaster.find().lean();
  const byCategory = Object.fromEntries(categories.map((c) => [c.name, c._id]));
  const byUnit = Object.fromEntries(units.map((u) => [u.name, u._id]));

  for (const row of DEFAULT_ITEMS) {
    const categoryId = byCategory[row.category];
    const unitId = byUnit[row.unit];
    if (!categoryId || !unitId) continue;
    const itemCode = await generatePharmacyItemCode();
    const manufacturingDate = moment().subtract(4, 'months').startOf('day').toDate();
    const expiryDate = moment(manufacturingDate)
      .add(row.bestBeforeMonths ?? 24, 'months')
      .startOf('day')
      .toDate();
    await PharmacyItem.create({
      itemCode,
      name: row.name,
      company: row.company ?? '',
      category: categoryId,
      packQuantity: row.packQuantity,
      unit: unitId,
      stock: row.stock,
      manufacturingDate,
      expiryDate,
      bestBeforeMonths: row.bestBeforeMonths ?? 24,
      monthlyUsagePercent: row.monthlyUsagePercent,
      salePrice: row.salePrice ?? 0,
    });
  }

  logger.info('Seeded default pharmacy inventory items');
};
