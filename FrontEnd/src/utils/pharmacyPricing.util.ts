export const calcWeightPrices = (
  boxPrice: number,
  gramsPerBox: number,
  spoonGrams: number
) => {
  const perGram = gramsPerBox > 0 ? boxPrice / gramsPerBox : 0;
  const perSpoon = perGram * spoonGrams;
  return {
    perGram: Math.round(perGram * 10000) / 10000,
    perSpoon: Math.round(perSpoon * 100) / 100,
  };
};

export const calcStripPrices = (stripPrice: number, tabletsPerStrip: number) => {
  const perTablet = tabletsPerStrip > 0 ? stripPrice / tabletsPerStrip : 0;
  return {
    perTablet: Math.round(perTablet * 10000) / 10000,
  };
};

export const formatPricePreview = (value: number) =>
  Number.isFinite(value) && value > 0 ? value.toFixed(2) : '0.00';
