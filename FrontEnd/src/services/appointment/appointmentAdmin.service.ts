import axiosInstance from '../http/axiosInstance';
import type { ApiResponse, HmsAppointment } from '@/types/api.types';
import type {
  AppointmentDoctor,
  AppointmentFormValues,
  AppointmentStats,
  DoctorAvailability,
} from '@/types/appointment.types';

class AppointmentAdminService {
  list() {
    return axiosInstance.get<ApiResponse<{ appointments: HmsAppointment[] }>>('/admin/appointments');
  }

  getStats() {
    return axiosInstance.get<ApiResponse<{ stats: AppointmentStats }>>(
      '/admin/appointments/stats/summary'
    );
  }

  listDoctors() {
    return axiosInstance.get<ApiResponse<{ doctors: AppointmentDoctor[] }>>(
      '/admin/appointments/doctors'
    );
  }

  getAvailability(staffCode: string, date: string) {
    return axiosInstance.get<ApiResponse<{ availability: DoctorAvailability }>>(
      '/admin/appointments/availability',
      { params: { staffCode, date } }
    );
  }

  listByStaff(staffCode: string) {
    return axiosInstance.get<ApiResponse<{ appointments: HmsAppointment[] }>>(
      `/admin/appointments/staff/${encodeURIComponent(staffCode)}`
    );
  }

  get(appointmentCode: string) {
    return axiosInstance.get<ApiResponse<{ appointment: HmsAppointment }>>(
      `/admin/appointments/${encodeURIComponent(appointmentCode)}`
    );
  }

  attend(
    appointmentCode: string,
    payload: {
      consultationFee?: number;
      visitNotes?: string;
      followUpDate?: string;
      followUpTimeSlot?: string;
      followUpNotes?: string;
      markPaid?: boolean;
      paymentMethod?: 'Cash' | 'UPI' | 'Card';
    }
  ) {
    return axiosInstance.patch<ApiResponse<{ appointment: HmsAppointment }>>(
      `/admin/appointments/${encodeURIComponent(appointmentCode)}/attend`,
      payload
    );
  }

  create(values: AppointmentFormValues) {
    return axiosInstance.post<ApiResponse<{ appointment: HmsAppointment }>>('/admin/appointments', {
      patientCode: values.patientId,
      staffCode: values.staffCode,
      appointmentType: 'General Consult',
      date: values.date,
      timeSlot: values.time,
      notes: values.notes || undefined,
    });
  }
}

export const appointmentAdminService = new AppointmentAdminService();
