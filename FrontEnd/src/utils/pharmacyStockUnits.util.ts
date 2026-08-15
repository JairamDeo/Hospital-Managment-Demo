import type { PharmacyItemApi, PharmacyItemType, SaleUnit } from '@/types/pharmacy.types';

export const getUnitsPerPack = (item: Pick<PharmacyItemApi, 'itemType' | 'unitsPerPack' | 'packQuantity'>) => {
  const type = item.itemType ?? 'unit';
  if (type === 'unit') return 1;
  if (item.unitsPerPack && item.unitsPerPack > 0) return item.unitsPerPack;
  if (item.packQuantity > 0) return item.packQuantity;
  return 1;
};

export const getStockBaseUnits = (item: PharmacyItemApi) => {
  if (item.stockBaseUnits != null) return item.stockBaseUnits;
  return item.stock;
};

export const getDefaultSaleUnit = (item: Pick<PharmacyItemApi, 'itemType' | 'defaultSaleUnit'>): SaleUnit =>
  item.defaultSaleUnit ?? (item.itemType === 'weight' ? 'spoon' : item.itemType === 'strip' ? 'unit' : 'unit');

export const getSaleUnits = (item: PharmacyItemApi): SaleUnit[] =>
  item.saleUnits?.length ? item.saleUnits : getDefaultSaleUnitsForType(item.itemType ?? 'unit');

export const getDefaultSaleUnitsForType = (itemType: PharmacyItemType): SaleUnit[] => {
  switch (itemType) {
    case 'strip':
      return ['unit', 'pack'];
    case 'weight':
      return ['spoon', 'gram', 'pack'];
    default:
      return ['unit', 'pack'];
  }
};

export const convertSaleToBase = (quantity: number, saleUnit: SaleUnit, item: PharmacyItemApi) => {
  const upp = getUnitsPerPack(item);
  const spoon = item.spoonSizeGrams ?? 1;
  switch (saleUnit) {
    case 'pack':
      return quantity * upp;
    case 'unit':
      return quantity;
    case 'gram':
      return quantity;
    case 'spoon':
      return quantity * spoon;
    default:
      return quantity;
  }
};

export const getUnitPrice = (item: PharmacyItemApi, saleUnit: SaleUnit) => {
  const salePrice = item.salePrice ?? 0;
  const upp = getUnitsPerPack(item);
  const spoon = item.spoonSizeGrams ?? 1;
  switch (saleUnit) {
    case 'pack':
      return salePrice;
    case 'unit':
      if ((item.itemType ?? 'unit') === 'strip') {
        return item.pricePerTablet ?? salePrice / upp;
      }
      return (item.itemType ?? 'unit') === 'unit' ? salePrice : salePrice / upp;
    case 'gram':
      return item.pricePerGram ?? salePrice / upp;
    case 'spoon':
      return item.pricePerSpoon ?? (salePrice / upp) * spoon;
    default:
      return salePrice;
  }
};

export const saleUnitLabel = (saleUnit: SaleUnit, item: PharmacyItemApi, unitName = '') => {
  const type = item.itemType ?? 'unit';
  switch (saleUnit) {
    case 'pack':
      if (type === 'strip') return 'box';
      if (type === 'weight') return 'pack';
      return unitName || 'pack';
    case 'unit':
      if (type === 'strip') return 'tablet';
      return unitName || 'unit';
    case 'gram':
      return 'g';
    case 'spoon':
      return 'spoon';
    default:
      return saleUnit;
  }
};

export const maxSaleQuantity = (item: PharmacyItemApi, saleUnit: SaleUnit) => {
  const base = getStockBaseUnits(item);
  const upp = getUnitsPerPack(item);
  const spoon = item.spoonSizeGrams ?? 1;
  switch (saleUnit) {
    case 'pack':
      return base / upp;
    case 'unit':
    case 'gram':
      return base;
    case 'spoon':
      return base / spoon;
    default:
      return base;
  }
};

export const allowsDecimalQty = (saleUnit: SaleUnit) => saleUnit === 'gram' || saleUnit === 'spoon';
