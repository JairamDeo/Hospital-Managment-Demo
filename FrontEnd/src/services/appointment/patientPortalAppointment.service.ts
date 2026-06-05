import axiosInstance from '../http/axiosInstance';
import type { ApiResponse, HmsAppointment } from '@/types/api.types';
import type {
  AppointmentDoctor,
  DoctorAvailability,
} from '@/types/appointment.types';

export interface PatientBookAppointmentPayload {
  staffCode: string;
  date: string;
  timeSlot: string;
  notes?: string;
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
}

export const patientPortalAppointmentService = new PatientPortalAppointmentService();
