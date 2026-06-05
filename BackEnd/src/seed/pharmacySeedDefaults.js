/** Shared default pharmacy inventory used by seed + migration backfill. */
export const PHARMACY_SEED_ITEMS = [
  {
    name: 'Brahmi Oil',
    company: 'Dabur India',
    category: 'Medicated Oil',
    packQuantity: 200,
    unit: 'ml',
    stock: 98,
    bestBeforeMonths: 24,
    monthlyUsagePercent: 82,
    salePrice: 450,
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
    salePrice: 320,
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
    salePrice: 180,
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
    salePrice: 280,
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
    salePrice: 220,
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
    salePrice: 150,
  },
];

/** Default sale price when no seed match exists (custom inventory). */
export const PHARMACY_DEFAULT_SALE_PRICE = 150;

const norm = (value) => String(value ?? '').trim().toLowerCase();

export const buildPharmacyPriceLookup = () => {
  const byName = new Map();
  const byNameCompany = new Map();

  for (const row of PHARMACY_SEED_ITEMS) {
    const nameKey = norm(row.name);
    const pairKey = `${nameKey}|${norm(row.company)}`;
    byName.set(nameKey, row);
    byNameCompany.set(pairKey, row);
  }

  return { byName, byNameCompany };
};

export const resolveSeedSalePrice = (item, lookup) => {
  const nameKey = norm(item.name);
  const pairKey = `${nameKey}|${norm(item.company)}`;
  const match = lookup.byNameCompany.get(pairKey) ?? lookup.byName.get(nameKey);
  if (match?.salePrice != null && match.salePrice > 0) {
    return match.salePrice;
  }
  return PHARMACY_DEFAULT_SALE_PRICE;
};
