import axiosInstance from '../http/axiosInstance';
import type { ApiResponse } from '@/types/api.types';
import type { BillingStats, Invoice, InvoiceDetail, PaymentMethodType } from '@/types/billing.types';

class BillingAdminService {
  list(params?: {
    status?: string;
    feeType?: string;
    search?: string;
    patientCode?: string;
  }) {
    return axiosInstance.get<ApiResponse<{ invoices: Invoice[] }>>('/admin/billing', { params });
  }

  getStats() {
    return axiosInstance.get<ApiResponse<{ stats: BillingStats }>>('/admin/billing/stats/summary');
  }

  get(invoiceCode: string) {
    return axiosInstance.get<ApiResponse<{ invoice: InvoiceDetail }>>(
      `/admin/billing/${encodeURIComponent(invoiceCode)}`
    );
  }

  collectPayment(invoiceCode: string, paymentMethod: PaymentMethodType) {
    return axiosInstance.patch<ApiResponse<{ invoice: InvoiceDetail }>>(
      `/admin/billing/${encodeURIComponent(invoiceCode)}/collect`,
      { paymentMethod }
    );
  }

  createMedicineBill(payload: {
    patientCode: string;
    items: { itemCode: string; quantity: number; unitPrice?: number }[];
    paymentMethod?: PaymentMethodType;
    markPaid?: boolean;
  }) {
    return axiosInstance.post<ApiResponse<{ invoice: InvoiceDetail }>>('/admin/billing/medicine', payload);
  }
}

export const billingAdminService = new BillingAdminService();
