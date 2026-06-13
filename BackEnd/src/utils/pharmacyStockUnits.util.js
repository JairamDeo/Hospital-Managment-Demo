export const PHARMACY_ITEM_TYPES = ['unit', 'strip', 'weight'];
export const SALE_UNITS = ['pack', 'unit', 'gram', 'spoon'];

export const normalizeItemType = (type) =>
  PHARMACY_ITEM_TYPES.includes(type) ? type : 'unit';

const STRIP_UNIT_RE = /tablet|capsule|strip|tab|cap/i;
const WEIGHT_UNIT_RE = /^(g|gm|gram|grams|mg|kg)$|powder|churan/i;

/** Infer type for legacy rows created before itemType existed. */
export const getEffectiveItemType = (item, unitName = '') => {
  if (item.stockInBaseUnits) return normalizeItemType(item.itemType);
  if (item.itemType && item.itemType !== 'unit') return normalizeItemType(item.itemType);
  const u = String(unitName || item.unitName || '').trim();
  const pq = Number(item.packQuantity) || 1;
  if (pq > 1 && STRIP_UNIT_RE.test(u)) return 'strip';
  if (WEIGHT_UNIT_RE.test(u)) return 'weight';
  return 'unit';
};

export const getUnitsPerPack = (item, unitName = '') => {
  const type = getEffectiveItemType(item, unitName);
  if (type === 'unit') return 1;
  const upp = Number(item.unitsPerPack);
  if (Number.isFinite(upp) && upp > 0) return upp;
  const pq = Number(item.packQuantity);
  return Number.isFinite(pq) && pq > 0 ? pq : 1;
};

export const usesBaseStock = (item) => item.stockInBaseUnits === true;

/** Total dispensable units (pieces, tablets, grams). */
export const getStockBaseUnits = (item, unitName = '') => {
  const raw = Number(item.stock);
  const stock = Number.isFinite(raw) ? raw : 0;
  if (usesBaseStock(item)) return stock;
  const type = getEffectiveItemType(item, unitName);
  if (type === 'unit') return stock;
  return stock * getUnitsPerPack(item, unitName);
};

export const getStockPacks = (item, unitName = '') => {
  const upp = getUnitsPerPack(item, unitName);
  const base = getStockBaseUnits(item, unitName);
  if (upp <= 0) return base;
  return base / upp;
};

export const getSaleUnitsForType = (itemType) => {
  switch (normalizeItemType(itemType)) {
    case 'strip':
      return ['unit', 'pack'];
    case 'weight':
      return ['spoon', 'gram', 'pack'];
    default:
      return ['unit', 'pack'];
  }
};

export const getDefaultSaleUnit = (itemType) => {
  switch (normalizeItemType(itemType)) {
    case 'strip':
      return 'unit';
    case 'weight':
      return 'spoon';
    default:
      return 'unit';
  }
};

export const convertSaleToBase = (quantity, saleUnit, item, unitName = '') => {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) return 0;
  const upp = getUnitsPerPack(item, unitName);
  const spoon = Number(item.spoonSizeGrams) || 1;
  switch (saleUnit) {
    case 'pack':
      return qty * upp;
    case 'unit':
      return qty;
    case 'gram':
      return qty;
    case 'spoon':
      return qty * spoon;
    default:
      return qty;
  }
};

export const getUnitPrice = (item, saleUnit, unitName = '') => {
  const salePrice = Number(item.salePrice) || 0;
  const upp = getUnitsPerPack(item, unitName);
  const spoon = Number(item.spoonSizeGrams) || 1;
  const type = getEffectiveItemType(item, unitName);
  switch (saleUnit) {
    case 'pack':
      return salePrice;
    case 'unit':
      if (type === 'strip') {
        const perTablet = Number(item.pricePerTablet);
        if (Number.isFinite(perTablet) && perTablet > 0) return perTablet;
        return salePrice / upp;
      }
      return type === 'unit' ? salePrice : salePrice / upp;
    case 'gram':
      return salePrice / upp;
    case 'spoon':
      return (salePrice / upp) * spoon;
    default:
      return salePrice;
  }
};

export const saleUnitLabel = (saleUnit, item, unitName = '') => {
  const type = getEffectiveItemType(item, unitName);
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

export const formatStockDisplay = (item, unitName = '') => {
  const type = getEffectiveItemType(item, unitName);
  const upp = getUnitsPerPack(item, unitName);
  const base = getStockBaseUnits(item, unitName);
  const packs = getStockPacks(item, unitName);

  if (type === 'unit') {
    const label = unitName || 'units';
    return `${Math.floor(base)} ${label}`;
  }
  if (type === 'strip') {
    const wholePacks = Math.floor(packs);
    return `${wholePacks} box${wholePacks === 1 ? '' : 'es'} · ${Math.floor(base)} tablets`;
  }
  const grams = Math.round(base * 100) / 100;
  const wholePacks = Math.floor(packs);
  return `${wholePacks} pack${wholePacks === 1 ? '' : 's'} · ${grams} g`;
};

const STRIP_TYPE_ALIASES = new Set([
  'box',
  'boxes',
  'strip',
  'strips',
  'tablet',
  'tablets',
  'tablet box',
  'tabletbox',
  'tablet strip',
  'tabletstrip',
]);
const WEIGHT_TYPE_ALIASES = new Set([
  'weight',
  'powder',
  'churan',
  'powder / churan',
  'powder/churan',
  'powder churan',
]);
const UNIT_TYPE_ALIASES = new Set([
  'unit',
  'single',
  'single item',
  'piece',
  'pieces',
  'bottle',
  'item',
]);

export const parseImportItemType = (raw) => {
  const key = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (!key) return null;
  if (STRIP_TYPE_ALIASES.has(key)) return 'strip';
  if (WEIGHT_TYPE_ALIASES.has(key)) return 'weight';
  if (UNIT_TYPE_ALIASES.has(key)) return 'unit';
  return normalizeItemType(key);
};

const LIQUID_UNIT_RE = /^(ml|l|litre|liter|litres|liters)$/i;

export const inferImportItemType = (packUnit = '', packQuantity = '') => {
  const unit = String(packUnit).trim();
  const pq = Number(packQuantity);
  if (WEIGHT_UNIT_RE.test(unit)) return 'weight';
  if (LIQUID_UNIT_RE.test(unit)) return 'unit';
  if (Number.isFinite(pq) && pq > 1 && STRIP_UNIT_RE.test(unit)) return 'strip';
  if (STRIP_UNIT_RE.test(unit)) return 'strip';
  return 'unit';
};

export const resolveImportStock = (row, defaultSpoonGrams = 1) => {
  const itemType =
    parseImportItemType(row.itemType) ??
    inferImportItemType(row.packUnit || row.itemLabel, row.packQuantity);

  const packQtyRaw = row.packQuantity?.toString().trim();
  const unitsPerPack =
    itemType === 'unit'
      ? 1
      : Number(packQtyRaw);

  if (itemType !== 'unit' && (!packQtyRaw || !Number.isFinite(unitsPerPack) || unitsPerPack <= 0)) {
    throw new Error(
      itemType === 'strip'
        ? 'Units Per Pack must be tablets per box (e.g. 30)'
        : 'Units Per Pack must be grams per box (e.g. 100)'
    );
  }

  const packSize =
    itemType === 'unit' && packQtyRaw && Number.isFinite(Number(packQtyRaw)) && Number(packQtyRaw) > 0
      ? Number(packQtyRaw)
      : unitsPerPack;

  const stockMeta = resolveCreateStock(
    {
      itemType,
      unitsPerPack,
      packQuantity: packSize,
      stock: row.stock,
      spoonSizeGrams: row.spoonSizeGrams,
    },
    defaultSpoonGrams
  );

  if (itemType === 'unit' && packSize > 1) {
    stockMeta.packQuantity = packSize;
  }

  return stockMeta;
};

export const resolveCreateStock = (payload, defaultSpoonGrams = 1) => {
  const itemType = normalizeItemType(payload.itemType);
  const stockPacks = Number(payload.stock);
  let unitsPerPack = 1;
  let spoonSizeGrams = null;

  if (itemType === 'strip' || itemType === 'weight') {
    unitsPerPack = Number(payload.unitsPerPack ?? payload.packQuantity);
    if (!Number.isFinite(unitsPerPack) || unitsPerPack <= 0) {
      throw new Error('Enter a valid size (tablets per box or grams per pack)');
    }
  }

  if (itemType === 'weight') {
    const fromPayload = Number(payload.spoonSizeGrams);
    spoonSizeGrams =
      Number.isFinite(fromPayload) && fromPayload > 0 ? fromPayload : defaultSpoonGrams;
  }

  if (!Number.isFinite(stockPacks) || stockPacks < 0) {
    throw new Error('Stock must be a valid number');
  }

  return {
    itemType,
    unitsPerPack,
    spoonSizeGrams,
    packQuantity: unitsPerPack,
    stock: stockPacks * unitsPerPack,
    stockInBaseUnits: true,
  };
};
