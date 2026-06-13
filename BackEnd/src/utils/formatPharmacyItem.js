import { getStockStatus } from './pharmacyStock.util.js';
import { formatPackSize, parseUnitSizeString } from './formatPackSize.js';
import { formatDisplayDate } from './pharmacyDates.util.js';
import {
  formatStockDisplay,
  getDefaultSaleUnit,
  getEffectiveItemType,
  getSaleUnitsForType,
  getStockBaseUnits,
  getStockPacks,
  getUnitsPerPack,
} from './pharmacyStockUnits.util.js';
import { attachPharmacyPricing } from './pharmacyPricing.util.js';

export const formatPharmacyItem = (doc, options = {}) => {
  const categoryName =
    typeof doc.category === 'object' && doc.category?.name
      ? doc.category.name
      : doc.categoryName ?? '';

  const unitName =
    typeof doc.unit === 'object' && doc.unit?.name ? doc.unit.name : doc.unitName ?? '';

  const itemType = getEffectiveItemType(doc, unitName);
  const unitsPerPack = getUnitsPerPack(doc, unitName);
  const stockBaseUnits = getStockBaseUnits(doc, unitName);
  const stockPacks = getStockPacks(doc, unitName);
  const safeStock = stockBaseUnits;

  let unitSize = '—';
  const packQty = Number(doc.packQuantity);

  if (Number.isFinite(packQty) && unitName) {
    unitSize = formatPackSize(packQty, unitName);
  } else if (doc.unitSize && !String(doc.unitSize).includes('NaN')) {
    const parsed = parseUnitSizeString(doc.unitSize);
    unitSize = parsed ? formatPackSize(parsed.qty, parsed.unit) : String(doc.unitSize);
  } else {
    const parsed = parseUnitSizeString(doc.unitSize);
    if (parsed) unitSize = formatPackSize(parsed.qty, parsed.unit);
  }

  const base = {
    _id: String(doc._id),
    itemCode: doc.itemCode,
    name: doc.name,
    company: doc.company ?? '',
    category: categoryName,
    categoryId:
      typeof doc.category === 'object' && doc.category?._id
        ? String(doc.category._id)
        : String(doc.category ?? ''),
    unitId:
      typeof doc.unit === 'object' && doc.unit?._id
        ? String(doc.unit._id)
        : String(doc.unit ?? ''),
    itemType,
    unitsPerPack,
    spoonSizeGrams: doc.spoonSizeGrams ?? null,
    packQuantity: Number.isFinite(packQty) ? packQty : unitsPerPack,
    unitSize,
    stockPacks: Math.round(stockPacks * 100) / 100,
    stockBaseUnits: safeStock,
    stockDisplay: formatStockDisplay({ ...doc, itemType, unitsPerPack }, unitName),
    saleUnits: getSaleUnitsForType(itemType),
    defaultSaleUnit: getDefaultSaleUnit(itemType),
    manufacturingDate: formatDisplayDate(doc.manufacturingDate),
    expiryDate: formatDisplayDate(doc.expiryDate),
    bestBeforeMonths: doc.bestBeforeMonths ?? null,
    subtitle: (() => {
      const exp = formatDisplayDate(doc.expiryDate);
      const base = exp
        ? `${categoryName} · ${unitSize} · Exp: ${exp}`
        : `${categoryName} · ${unitSize}`;
      return doc.company ? `${base} · ${doc.company}` : base;
    })(),
    stock: safeStock,
    status: getStockStatus(stockPacks),
    monthlyUsagePercent: doc.monthlyUsagePercent ?? 0,
    salePrice: Number(doc.salePrice) || 0,
  };

  return attachPharmacyPricing(base, options.defaultSpoonGrams ?? 1);
};
