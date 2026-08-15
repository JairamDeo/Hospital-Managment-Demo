import type { StockStatus } from '@/types/pharmacy.types';

export const getStockStatus = (stock: number): StockStatus => {
  if (stock <= 100) return 'Critical';
  if (stock <= 250) return 'Low';
  return 'OK';
};
