import axiosInstance from '../http/axiosInstance';
import type { SaleUnit } from '@/types/pharmacy.types';
import type { ApiResponse } from '@/types/api.types';
import type { BillingStats, Invoice, InvoiceDetail, OfflinePaymentMethodType, PaymentCollectionSuccess, RazorpayOrderResponse, RazorpayPublicConfig, RazorpayQrResponse } from '@/types/billing.types';

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

  getRazorpayConfig() {
    return axiosInstance.get<ApiResponse<{ razorpay: RazorpayPublicConfig }>>(
      '/admin/billing/razorpay/config'
    );
  }

  createRazorpayOrder(invoiceCode: string, amount?: number) {
    return axiosInstance.post<ApiResponse<{ order: RazorpayOrderResponse }>>(
      `/admin/billing/${encodeURIComponent(invoiceCode)}/razorpay/order`,
      amount != null ? { amount } : {}
    );
  }

  createRazorpayQr(invoiceCode: string, amount?: number) {
    return axiosInstance.post<ApiResponse<{ qr: RazorpayQrResponse }>>(
      `/admin/billing/${encodeURIComponent(invoiceCode)}/razorpay/qr`,
      amount != null ? { amount } : {}
    );
  }

  getRazorpayStatus(qrCodeId: string) {
    return axiosInstance.get<
      ApiResponse<{
        status: 'pending' | 'paid';
        invoice?: InvoiceDetail;
        collection?: PaymentCollectionSuccess;
        qrCodeId?: string;
        amount?: number;
      }>
    >(`/admin/billing/razorpay/status/${encodeURIComponent(qrCodeId)}`);
  }

  get(invoiceCode: string) {
    return axiosInstance.get<ApiResponse<{ invoice: InvoiceDetail }>>(
      `/admin/billing/${encodeURIComponent(invoiceCode)}`
    );
  }

  collectPayment(invoiceCode: string, paymentMethod: OfflinePaymentMethodType, amount?: number) {
    return axiosInstance.patch<
      ApiResponse<{ invoice: InvoiceDetail; collection: PaymentCollectionSuccess }>
    >(
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
    paymentMethod?: OfflinePaymentMethodType;
    markPaid?: boolean;
  }) {
    return axiosInstance.post<ApiResponse<{ invoice: InvoiceDetail }>>('/admin/billing/medicine', payload);
  }

  createPanchakarmaPayment(payload: {
    programCode: string;
    amount?: number;
    paymentMethod?: OfflinePaymentMethodType;
    markPaid?: boolean;
  }) {
    return axiosInstance.post<ApiResponse<{ invoice: InvoiceDetail }>>(
      '/admin/billing/panchakarma',
      payload
    );
  }
}

export const billingAdminService = new BillingAdminService();
