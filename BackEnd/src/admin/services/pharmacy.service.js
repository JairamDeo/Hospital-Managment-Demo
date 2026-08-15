import PharmacyItem from '../../models/pharmacyItem.model.js';
import PharmacyCategoryMaster from '../../models/pharmacyCategoryMaster.model.js';
import PharmacyUnitMaster from '../../models/pharmacyUnitMaster.model.js';
import moment from 'moment';
import { PHARMACY_MESSAGES } from '../../utils/constants.js';
import { generatePharmacyItemCode } from '../../utils/generatePharmacyItemCode.js';
import { formatPharmacyItem } from '../../utils/formatPharmacyItem.js';
import { buildStockAlertMessage } from '../../utils/pharmacyStock.util.js';
import { resolvePharmacyDates } from '../../utils/pharmacyDates.util.js';
import { resolveCreateStock } from '../../utils/pharmacyStockUnits.util.js';
import { getDefaultPharmacySpoonGrams } from '../../utils/pharmacySpoon.util.js';
import {
  categoryBrandMatch,
  escapeRegex,
  parsePharmacyListQuery,
  stockFilterForStatus,
  stockPacksPipelineFields,
} from '../../utils/pharmacyQuery.util.js';

const loadActiveItemsForPanels = async () => {
  const docs = await PharmacyItem.find({ active: true })
    .populate('category', 'name')
    .populate('unit', 'name')
    .lean();
  return docs.map(formatPharmacyItem);
};

const buildListPipeline = ({ search, categoryId, brand, stock }) => {
  const pipeline = [
    {
      $match: {
        active: true,
        ...categoryBrandMatch({ categoryId, brand }),
      },
    },
    {
      $lookup: {
        from: 'pharmacycategorymasters',
        localField: 'category',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'pharmacyunitmasters',
        localField: 'unit',
        foreignField: '_id',
        as: 'unit',
      },
    },
    { $unwind: { path: '$unit', preserveNullAndEmptyArrays: true } },
    stockPacksPipelineFields(),
  ];

  if (stock !== 'all') {
    pipeline.push({ $match: stockFilterForStatus(stock) });
  }

  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    pipeline.push({
      $match: {
        $or: [
          { name: regex },
          { itemCode: regex },
          { company: regex },
          { 'category.name': regex },
        ],
      },
    });
  }

  return pipeline;
};

export const getPharmacyFilterOptions = async () => {
  const brands = await PharmacyItem.distinct('company', {
    active: true,
    company: { $exists: true, $nin: [null, ''] },
  });
  return {
    brands: brands
      .map((b) => String(b).trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b)),
  };
};

export const listPharmacyItems = async (queryInput = {}) => {
  let { page, limit, search, categoryId, brand, stock } = parsePharmacyListQuery(queryInput);

  const basePipeline = buildListPipeline({ search, categoryId, brand, stock });

  const countResult = await PharmacyItem.aggregate([...basePipeline, { $count: 'total' }]);
  const total = countResult[0]?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  page = Math.min(page, totalPages);
  const skip = (page - 1) * limit;

  const docs = await PharmacyItem.aggregate([
    ...basePipeline,
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  ]);

  const defaultSpoonGrams = await getDefaultPharmacySpoonGrams();
  return {
    items: docs.map((doc) => formatPharmacyItem(doc, { defaultSpoonGrams })),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

export const getPharmacyStats = async () => {
  const base = [{ $match: { active: true } }, stockPacksPipelineFields()];
  const [totalItems, critical, lowStock] = await Promise.all([
    PharmacyItem.countDocuments({ active: true }),
    PharmacyItem.aggregate([...base, { $match: stockFilterForStatus('critical') }, { $count: 'n' }]).then(
      (r) => r[0]?.n ?? 0
    ),
    PharmacyItem.aggregate([...base, { $match: stockFilterForStatus('low') }, { $count: 'n' }]).then(
      (r) => r[0]?.n ?? 0
    ),
  ]);
  return { totalItems, lowStock, critical };
};

/** All active, non-expired items for medicine billing (no pagination). */
export const listPharmacyItemsForBilling = async () => {
  const startOfToday = moment().startOf('day').toDate();
  const docs = await PharmacyItem.find({
    active: true,
    $or: [
      { expiryDate: { $gte: startOfToday } },
      { expiryDate: null },
      { expiryDate: { $exists: false } },
    ],
  })
    .populate('category', 'name')
    .populate('unit', 'name')
    .sort({ name: 1 })
    .lean();

  const defaultSpoonGrams = await getDefaultPharmacySpoonGrams();
  return docs.map((doc) => formatPharmacyItem(doc, { defaultSpoonGrams }));
};

export const getPharmacyOverview = async (queryInput = {}) => {
  const [{ items, pagination }, stats, panelItems, filterOptions] = await Promise.all([
    listPharmacyItems(queryInput),
    getPharmacyStats(),
    loadActiveItemsForPanels(),
    getPharmacyFilterOptions(),
  ]);

  const alerts = panelItems
    .filter((i) => i.status === 'Critical' || i.status === 'Low')
    .map((i) => ({
      id: i._id,
      itemName: i.name,
      status: i.status,
      message: buildStockAlertMessage(i.name, i.stockPacks, i.status),
    }));

  const monthlyUsage = [...panelItems]
    .filter((i) => i.monthlyUsagePercent > 0)
    .sort((a, b) => b.monthlyUsagePercent - a.monthlyUsagePercent)
    .slice(0, 5)
    .map((i) => ({
      id: i._id,
      name: i.name,
      usage: i.monthlyUsagePercent,
    }));

  return { items, pagination, stats, alerts, monthlyUsage, filterOptions };
};

export const createPharmacyItem = async (payload) => {
  const category = await PharmacyCategoryMaster.findById(payload.categoryId);
  if (!category) throw new Error(PHARMACY_MESSAGES.CATEGORY_NOT_FOUND);
  if (!category.active) throw new Error(PHARMACY_MESSAGES.CATEGORY_INACTIVE);

  const unit = await PharmacyUnitMaster.findById(payload.unitId);
  if (!unit) throw new Error(PHARMACY_MESSAGES.UNIT_NOT_FOUND);
  if (!unit.active) throw new Error(PHARMACY_MESSAGES.UNIT_INACTIVE);

  const dates = resolvePharmacyDates({
    manufacturingDate: payload.manufacturingDate,
    expiryDate: payload.expiryDate,
    bestBeforeMonths: payload.bestBeforeMonths,
  });

  const defaultSpoonGrams = await getDefaultPharmacySpoonGrams();
  const stockMeta = resolveCreateStock(payload, defaultSpoonGrams);

  const itemCode = await generatePharmacyItemCode();
  const doc = await PharmacyItem.create({
    itemCode,
    name: payload.name.trim(),
    company: (payload.company ?? '').trim(),
    category: category._id,
    itemType: stockMeta.itemType,
    unitsPerPack: stockMeta.unitsPerPack,
    spoonSizeGrams: stockMeta.spoonSizeGrams,
    stockInBaseUnits: stockMeta.stockInBaseUnits,
    packQuantity: stockMeta.packQuantity,
    unit: unit._id,
    stock: stockMeta.stock,
    salePrice: payload.salePrice,
    manufacturingDate: dates.manufacturingDate,
    expiryDate: dates.expiryDate,
    bestBeforeMonths: dates.bestBeforeMonths,
    monthlyUsagePercent: payload.monthlyUsagePercent ?? 0,
  });

  const populated = await PharmacyItem.findById(doc._id)
    .populate('category', 'name')
    .populate('unit', 'name')
    .lean();

  return formatPharmacyItem(populated, { defaultSpoonGrams });
};
