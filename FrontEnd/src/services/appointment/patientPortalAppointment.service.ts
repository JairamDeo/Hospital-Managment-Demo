import axiosInstance from '../http/axiosInstance';
import type { ApiResponse, HmsAppointment } from '@/types/api.types';
import type { RazorpayOrderResponse, RazorpayPublicConfig } from '@/types/billing.types';
import type {
  AppointmentDoctor,
  DoctorAvailability,
} from '@/types/appointment.types';
import type { RazorpaySuccessResponse } from '@/utils/razorpayCheckout';

export interface PatientBookAppointmentPayload {
  staffCode: string;
  date: string;
  timeSlot: string;
  notes?: string;
  appointmentType?: string;
}

export interface VerifyAppointmentPaymentPayload {
  appointmentCode: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

class PatientPortalAppointmentService {
  listMine() {
    return axiosInstance.get<ApiResponse<{ appointments: HmsAppointment[] }>>(
      '/patient-portal/appointments'
    );
  }

  listDoctors() {
    return axiosInstance.get<ApiResponse<{ doctors: AppointmentDoctor[] }>>(
      '/patient-portal/appointments/doctors'
    );
  }

  getAvailability(staffCode: string, date: string) {
    return axiosInstance.get<ApiResponse<{ availability: DoctorAvailability }>>(
      '/patient-portal/appointments/availability',
      { params: { staffCode, date } }
    );
  }

  book(payload: PatientBookAppointmentPayload) {
    return axiosInstance.post<ApiResponse<{ appointment: HmsAppointment }>>(
      '/patient-portal/appointments',
      payload
    );
  }

  getRazorpayConfig() {
    return axiosInstance.get<ApiResponse<{ razorpay: RazorpayPublicConfig }>>(
      '/patient-portal/billing/razorpay/config'
    );
  }

  getPaymentStatus(appointmentCode: string) {
    return axiosInstance.get<
      ApiResponse<{ appointment: HmsAppointment; razorpay: RazorpayPublicConfig }>
    >(`/patient-portal/appointments/${encodeURIComponent(appointmentCode)}/payment`);
  }

  createRazorpayOrder(appointmentCode: string) {
    return axiosInstance.post<
      ApiResponse<{ order: RazorpayOrderResponse; appointment: HmsAppointment }>
    >(`/patient-portal/appointments/${encodeURIComponent(appointmentCode)}/razorpay/order`);
  }

  verifyRazorpayPayment(appointmentCode: string, payload: Omit<VerifyAppointmentPaymentPayload, 'appointmentCode'>) {
    return axiosInstance.post<
      ApiResponse<{ appointment: HmsAppointment; invoice: unknown; collection: unknown }>
    >(`/patient-portal/appointments/${encodeURIComponent(appointmentCode)}/razorpay/verify`, {
      appointmentCode,
      ...payload,
    });
  }
}

export const patientPortalAppointmentService = new PatientPortalAppointmentService();

export const payAppointmentWithRazorpay = async (
  appointmentCode: string,
  patientName: string,
  onPaid?: (appointment: HmsAppointment) => void
) => {
  const { openRazorpayCheckout } = await import('@/utils/razorpayCheckout');

  const configRes = await patientPortalAppointmentService.getRazorpayConfig();
  const razorpay = configRes.data.res?.razorpay;
  if (!razorpay?.enabled) {
    throw new Error('Online payment is not available right now');
  }

  const orderRes = await patientPortalAppointmentService.createRazorpayOrder(appointmentCode);
  const order = orderRes.data.res?.order;
  if (!order) throw new Error('Could not start payment');

  await openRazorpayCheckout(
    {
      keyId: order.keyId,
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      invoiceCode: order.invoiceCode,
      patientName: order.patientName || patientName,
      description: order.description,
    },
    async (response: RazorpaySuccessResponse) => {
      const verifyRes = await patientPortalAppointmentService.verifyRazorpayPayment(appointmentCode, {
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      });
      const updated = verifyRes.data.res?.appointment;
      if (updated) onPaid?.(updated);
    }
  );
};
