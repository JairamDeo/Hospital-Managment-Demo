import type { LucideIcon } from 'lucide-react';

export type StockStatus = 'Critical' | 'Low' | 'OK';

export type PharmacyItemType = 'unit' | 'strip' | 'weight';

export type SaleUnit = 'pack' | 'unit' | 'gram' | 'spoon';

export type PharmacyStockFilter = 'all' | 'critical' | 'low';

export interface PharmacyFilterOptions {
  brands: string[];
}

export interface PharmacyItemApi {
  _id: string;
  itemCode: string;
  name: string;
  company: string;
  category: string;
  categoryId: string;
  unitId: string;
  itemType?: PharmacyItemType;
  unitsPerPack?: number;
  spoonSizeGrams?: number | null;
  packQuantity: number;
  unitSize: string;
  stockPacks?: number;
  stockBaseUnits?: number;
  stockDisplay?: string;
  saleUnits?: SaleUnit[];
  defaultSaleUnit?: SaleUnit;
  manufacturingDate: string;
  expiryDate: string;
  bestBeforeMonths: number | null;
  subtitle: string;
  stock: number;
  status: StockStatus;
  monthlyUsagePercent: number;
  salePrice?: number;
  pricePerGram?: number | null;
  pricePerSpoon?: number | null;
  pricePerTablet?: number | null;
}

export interface PharmacyItemView extends PharmacyItemApi {
  id: string;
  icon: LucideIcon;
}

export interface PharmacyStats {
  totalItems: number;
  lowStock: number;
  critical: number;
}

export interface PharmacyPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const PHARMACY_PAGE_SIZE = 10;

export interface StockAlert {
  id: string;
  itemName: string;
  status: 'Critical' | 'Low';
  message: string;
}

export interface MonthlyUsageItem {
  id: string;
  name: string;
  usage: number;
}

export interface PharmacyImportSummary {
  created: number;
  updated: number;
  failed: number;
  priceDefaulted?: number;
  errors: { line: number; message: string }[];
  warnings?: string[];
}

export interface PharmacyItemFormValues {
  name: string;
  company: string;
  categoryId: string;
  itemType: PharmacyItemType;
  itemLabel: string;
  packQuantity: string;
  unitId: string;
  stock: string;
  manufacturingDate: string;
  expiryDate: string;
  bestBeforeMonths: string;
  salePrice: string;
  pricePerGram: string;
  pricePerTablet: string;
}

export const emptyPharmacyItemForm = (): PharmacyItemFormValues => ({
  name: '',
  company: '',
  categoryId: '',
  itemType: 'unit',
  itemLabel: '',
  packQuantity: '',
  unitId: '',
  stock: '',
  manufacturingDate: '',
  expiryDate: '',
  bestBeforeMonths: '',
  salePrice: '',
  pricePerGram: '',
  pricePerTablet: '',
});

