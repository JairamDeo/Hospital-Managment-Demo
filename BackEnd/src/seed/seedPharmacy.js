import PharmacyCategoryMaster from '../models/pharmacyCategoryMaster.model.js';
import PharmacyUnitMaster from '../models/pharmacyUnitMaster.model.js';
import PharmacyItem from '../models/pharmacyItem.model.js';
import moment from 'moment';
import { generatePharmacyItemCode } from '../utils/generatePharmacyItemCode.js';
import { logger } from '../utils/logger.js';

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

const DEFAULT_ITEMS = [
  {
    name: 'Brahmi Oil',
    company: 'Dabur India',
    category: 'Medicated Oil',
    packQuantity: 200,
    unit: 'ml',
    stock: 98,
    bestBeforeMonths: 24,
    monthlyUsagePercent: 82,
  },
  {
    name: 'Ashwagandha Powder',
    company: 'Himalaya Wellness',
    category: 'Adaptogen',
    packQuantity: 500,
    unit: 'g',
    stock: 215,
    bestBeforeMonths: 36,
    monthlyUsagePercent: 88,
  },
  {
    name: 'Triphala Churna',
    company: 'Baidyanath',
    category: 'Herbal Formula',
    packQuantity: 250,
    unit: 'g',
    stock: 380,
    bestBeforeMonths: 24,
    monthlyUsagePercent: 95,
  },
  {
    name: 'Chyawanprash',
    company: 'Dabur India',
    category: 'Rasayana',
    packQuantity: 500,
    unit: 'g',
    stock: 275,
    bestBeforeMonths: 18,
    monthlyUsagePercent: 65,
  },
  {
    name: 'Shatavari',
    company: 'Patanjali Ayurved',
    category: 'Herbal Extract',
    packQuantity: 100,
    unit: 'g',
    stock: 88,
    bestBeforeMonths: 24,
    monthlyUsagePercent: 72,
  },
  {
    name: 'Amla Juice',
    company: 'Patanjali Ayurved',
    category: 'Health Tonic',
    packQuantity: 1,
    unit: 'L',
    stock: 95,
    bestBeforeMonths: 12,
    monthlyUsagePercent: 75,
  },
];

const nextCategoryCode = async () => {
  const count = await PharmacyCategoryMaster.countDocuments();
  return `PHC-${String(count + 1).padStart(3, '0')}`;
};

const nextUnitCode = async () => {
  const count = await PharmacyUnitMaster.countDocuments();
  return `PHU-${String(count + 1).padStart(3, '0')}`;
};

export const seedPharmacyIfEmpty = async () => {
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
    });
  }

  logger.info('Seeded default pharmacy inventory items');
};
