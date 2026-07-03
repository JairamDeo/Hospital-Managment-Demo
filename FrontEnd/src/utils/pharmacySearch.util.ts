import type { PharmacyItemApi } from '@/types/pharmacy.types';

export const PHARMACY_SEARCH_MIN_CHARS = 2;
export const PHARMACY_SEARCH_MAX_RESULTS = 25;

const scorePharmacyItem = (item: PharmacyItemApi, query: string): number => {
  const name = item.name?.toLowerCase() ?? '';
  const code = item.itemCode?.toLowerCase() ?? '';
  const company = item.company?.toLowerCase() ?? '';
  const category = item.category?.toLowerCase() ?? '';
  const unitSize = item.unitSize?.toLowerCase() ?? '';

  if (name === query) return 100;
  if (code === query) return 95;
  if (name.startsWith(query)) return 85;
  if (code.startsWith(query)) return 80;
  if (name.includes(query)) return 70;
  if (company.startsWith(query)) return 55;
  if (company.includes(query)) return 45;
  if (category.includes(query)) return 35;
  if (unitSize.includes(query)) return 30;
  if (code.includes(query)) return 25;
  return 0;
};

/** Ranked pharmacy search — returns empty when query is blank or too short. */
export const searchPharmacyItems = (
  items: PharmacyItemApi[],
  query: string,
  limit = PHARMACY_SEARCH_MAX_RESULTS,
  options?: { itemType?: PharmacyItemApi['itemType'] | 'non-weight' }
): PharmacyItemApi[] => {
  const q = query.trim().toLowerCase();
  if (q.length < PHARMACY_SEARCH_MIN_CHARS) return [];

  const typeFilter = options?.itemType;
  const filtered = items.filter((item) => {
    const type = item.itemType ?? 'unit';
    if (typeFilter === 'weight') return type === 'weight';
    if (typeFilter === 'non-weight') return type !== 'weight';
    if (typeFilter) return type === typeFilter;
    return true;
  });

  return filtered
    .map((item) => ({ item, score: scorePharmacyItem(item, q) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .slice(0, limit)
    .map((row) => row.item);
};
