const DISCRETE_UNITS = new Set([
  'tablet',
  'capsule',
  'strip',
  'sachet',
  'bottle',
  'vial',
  'ampoule',
  'drop',
  'unit',
]);

/** Parse legacy strings like "200ml", "500g", "1L" */
export const parseUnitSizeString = (value) => {
  const s = String(value ?? '').trim();
  if (!s) return null;
  const match = s.match(/^([\d.]+)\s*([a-zA-Z]+)$/);
  if (!match) return null;
  const qty = parseFloat(match[1]);
  if (!Number.isFinite(qty)) return null;
  let unit = match[2];
  if (unit.toLowerCase() === 'gm') unit = 'g';
  if (unit.toLowerCase() === 'l') unit = 'L';
  if (unit.toLowerCase() === 'litre' || unit.toLowerCase() === 'liter') unit = 'L';
  return { qty, unit };
};

/** Display pack size e.g. 200ml, 500g, 1L, 10 tablet */
export const formatPackSize = (packQuantity, unitName = '') => {
  const qty = Number(packQuantity);
  const unit = String(unitName).trim();

  if (!Number.isFinite(qty)) {
    return unit || '—';
  }

  if (!unit) return String(qty);

  if (DISCRETE_UNITS.has(unit.toLowerCase())) {
    return `${qty} ${unit}`;
  }
  return `${qty}${unit}`;
};
