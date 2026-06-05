import { getStockStatus } from './pharmacyStock.util.js';
import { formatPackSize, parseUnitSizeString } from './formatPackSize.js';
import { formatDisplayDate } from './pharmacyDates.util.js';

export const formatPharmacyItem = (doc) => {
  const categoryName =
    typeof doc.category === 'object' && doc.category?.name
      ? doc.category.name
      : doc.categoryName ?? '';

  const unitName =
    typeof doc.unit === 'object' && doc.unit?.name ? doc.unit.name : doc.unitName ?? '';

  const stock = Number(doc.stock);
  const safeStock = Number.isFinite(stock) ? stock : 0;

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

  return {
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
    packQuantity: Number.isFinite(packQty) ? packQty : 0,
    unitSize,
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
    status: getStockStatus(safeStock),
    monthlyUsagePercent: doc.monthlyUsagePercent ?? 0,
    salePrice: Number(doc.salePrice) || 0,
  };
};
