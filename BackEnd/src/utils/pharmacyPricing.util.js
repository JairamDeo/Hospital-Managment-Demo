import { resolveSpoonGrams } from './pharmacySpoon.util.js';

export const attachWeightPricing = (item, defaultSpoonGrams = 1) => {
  if (item.itemType !== 'weight') {
    return { ...item, pricePerGram: null, pricePerSpoon: null };
  }

  const gramsPerBox = Number(item.unitsPerPack) || Number(item.packQuantity) || 1;
  const boxPrice = Number(item.salePrice) || 0;
  const spoon = resolveSpoonGrams(item, defaultSpoonGrams);
  const pricePerGram =
    gramsPerBox > 0 ? Math.round((boxPrice / gramsPerBox) * 10000) / 10000 : 0;
  const pricePerSpoon = Math.round(pricePerGram * spoon * 100) / 100;

  return {
    ...item,
    spoonSizeGrams: spoon,
    pricePerGram,
    pricePerSpoon,
  };
};

export const attachStripPricing = (item) => {
  if (item.itemType !== 'strip') {
    return { ...item, pricePerTablet: null };
  }
  const perStrip = Number(item.unitsPerPack) || Number(item.packQuantity) || 1;
  const stripPrice = Number(item.salePrice) || 0;
  const pricePerTablet =
    perStrip > 0 ? Math.round((stripPrice / perStrip) * 10000) / 10000 : 0;
  return { ...item, pricePerTablet };
};

export const attachPharmacyPricing = (item, defaultSpoonGrams = 1) =>
  attachStripPricing(attachWeightPricing(item, defaultSpoonGrams));
