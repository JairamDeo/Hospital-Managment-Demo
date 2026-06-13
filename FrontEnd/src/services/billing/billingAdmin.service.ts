import axiosInstance from '../http/axiosInstance';
import type { SaleUnit } from '@/types/pharmacy.types';
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

  collectPayment(invoiceCode: string, paymentMethod: PaymentMethodType, amount?: number) {
    return axiosInstance.patch<ApiResponse<{ invoice: InvoiceDetail }>>(
      `/admin/billing/${encodeURIComponent(invoiceCode)}/collect`,
      { paymentMethod, ...(amount != null ? { amount } : {}) }
    );
  }

  createMedicineBill(payload: {
    patientCode: string;
    items: {
      itemCode: string;
      quantity: number;
      saleUnit?: SaleUnit;
      unitPrice?: number;
    }[];
    paymentMethod?: PaymentMethodType;
    markPaid?: boolean;
  }) {
    return axiosInstance.post<ApiResponse<{ invoice: InvoiceDetail }>>('/admin/billing/medicine', payload);
  }

  createPanchakarmaPayment(payload: {
    programCode: string;
    amount?: number;
    paymentMethod?: PaymentMethodType;
    markPaid?: boolean;
  }) {
    return axiosInstance.post<ApiResponse<{ invoice: InvoiceDetail }>>(
      '/admin/billing/panchakarma',
      payload
    );
  }
}

export const billingAdminService = new BillingAdminService();
