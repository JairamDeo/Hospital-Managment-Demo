import {
  getEffectiveItemType,
  getStockBaseUnits,
  getUnitsPerPack,
} from './pharmacyStockUnits.util.js';

/** Persist stock after deducting base units (grams, tablets, etc.). */
export const applyStockBaseDeduction = (item, unitName, baseNeeded) => {
  const stockBase = getStockBaseUnits(item, unitName);
  if (baseNeeded > stockBase) {
    return { ok: false, available: stockBase };
  }

  const newBase = Math.max(0, Math.round((stockBase - baseNeeded) * 1000) / 1000);
  const effectiveType = getEffectiveItemType(item, unitName);
  const upp = getUnitsPerPack(item, unitName);

  if (item.stockInBaseUnits || effectiveType !== 'unit') {
    item.stock = newBase;
    item.stockInBaseUnits = true;
    if (!item.itemType || item.itemType === 'unit') item.itemType = effectiveType;
    if (!item.unitsPerPack || item.unitsPerPack <= 1) item.unitsPerPack = upp;
  } else {
    item.stock = Math.max(0, Math.ceil(newBase));
  }

  return { ok: true, newBase };
};
