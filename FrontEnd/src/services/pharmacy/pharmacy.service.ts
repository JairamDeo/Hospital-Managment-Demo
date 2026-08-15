import axiosInstance from '../http/axiosInstance';
import type { ApiResponse } from '@/types/api.types';
import type {
  MonthlyUsageItem,
  PharmacyFilterOptions,
  PharmacyStockFilter,
  PharmacyImportSummary,
  PharmacyItemApi,
  PharmacyItemFormValues,
  PharmacyPagination,
  PharmacyStats,
  StockAlert,
} from '@/types/pharmacy.types';
import { PHARMACY_PAGE_SIZE } from '@/types/pharmacy.types';

export interface PharmacyOverview {
  items: PharmacyItemApi[];
  pagination: PharmacyPagination;
  stats: PharmacyStats;
  alerts: StockAlert[];
  monthlyUsage: MonthlyUsageItem[];
  filterOptions?: PharmacyFilterOptions;
}

export interface PharmacyListParams {
  page?: number;
  limit?: number;
  search?: string;
  stockFilter?: PharmacyStockFilter;
  categoryId?: string;
  brand?: string;
}

const filenameFromDisposition = (header?: string, fallback = 'download') => {
  if (!header) return fallback;
  const match = /filename="?([^";]+)"?/i.exec(header);
  return match?.[1] ?? fallback;
};

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

class PharmacyService {
  getOverview(params: PharmacyListParams = {}) {
    const searchParams = new URLSearchParams();
    searchParams.set('page', String(params.page ?? 1));
    searchParams.set('limit', String(params.limit ?? PHARMACY_PAGE_SIZE));
    if (params.search?.trim()) searchParams.set('search', params.search.trim());
    if (params.stockFilter && params.stockFilter !== 'all') {
      searchParams.set('stock', params.stockFilter);
    }
    if (params.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params.brand?.trim()) searchParams.set('brand', params.brand.trim());
    const qs = searchParams.toString();
    return axiosInstance.get<ApiResponse<PharmacyOverview>>(`/admin/pharmacy?${qs}`);
  }

  createItem(values: PharmacyItemFormValues) {
    return axiosInstance.post<
      ApiResponse<PharmacyOverview & { item: PharmacyItemApi }>
    >('/admin/pharmacy', {
      name: values.name.trim(),
      company: values.company.trim(),
      categoryId: values.categoryId,
      itemType: values.itemType,
      unitsPerPack: values.itemType === 'unit' ? 1 : Number(values.packQuantity),
      packQuantity: values.itemType === 'unit' ? 1 : Number(values.packQuantity),
      unitId: values.unitId,
      stock: Number(values.stock),
      manufacturingDate: values.manufacturingDate,
      expiryDate: values.expiryDate || undefined,
      bestBeforeMonths: values.bestBeforeMonths.trim()
        ? Number(values.bestBeforeMonths)
        : undefined,
      salePrice: Number(values.salePrice),
    });
  }

  async exportCsv() {
    const { data, headers } = await axiosInstance.get<Blob>('/admin/pharmacy/export/csv', {
      responseType: 'blob',
    });
    const filename = filenameFromDisposition(headers['content-disposition'], 'pharmacy-data.csv');
    triggerDownload(data, filename);
  }

  async exportPdf() {
    const { data, headers } = await axiosInstance.get<Blob>('/admin/pharmacy/export/pdf', {
      responseType: 'blob',
    });
    const filename = filenameFromDisposition(headers['content-disposition'], 'pharmacy-data.pdf');
    triggerDownload(data, filename);
  }

  async downloadImportTemplate() {
    const { data, headers } = await axiosInstance.get<Blob>('/admin/pharmacy/import/template', {
      responseType: 'blob',
    });
    const filename = filenameFromDisposition(
      headers['content-disposition'],
      'pharmacy-import-template.csv'
    );
    triggerDownload(data, filename);
  }

  importCsv(file: File) {
    const form = new FormData();
    form.append('file', file);
    return axiosInstance.post<
      ApiResponse<PharmacyOverview & { summary: PharmacyImportSummary }>
    >('/admin/pharmacy/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  getBillingItems() {
    return axiosInstance.get<ApiResponse<{ items: PharmacyItemApi[] }>>(
      '/admin/pharmacy/billing-items'
    );
  }
}

export const pharmacyService = new PharmacyService();
