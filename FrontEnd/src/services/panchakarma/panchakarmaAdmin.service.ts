import axiosInstance from '../http/axiosInstance';
import type { ApiResponse, HmsPanchakarmaProgram } from '@/types/api.types';
import type {
  PanchakarmaStats,
  ProgramAttendPayload,
  ScheduleProgramFormValues,
  TreatmentRoom,
} from '@/types/panchakarma.types';

class PanchakarmaAdminService {
  listPrograms() {
    return axiosInstance.get<ApiResponse<{ programs: HmsPanchakarmaProgram[] }>>(
      '/admin/panchakarma/programs'
    );
  }

  getStats() {
    return axiosInstance.get<ApiResponse<{ stats: PanchakarmaStats }>>(
      '/admin/panchakarma/programs/stats/summary'
    );
  }

  listTherapists() {
    return axiosInstance.get<
      ApiResponse<{
        therapists: Array<{
          staffCode: string;
          id: string;
          name: string;
          specialty: string;
          patientCount: number;
        }>;
      }>
    >('/admin/panchakarma/programs/therapists');
  }

  listRooms() {
    return axiosInstance.get<ApiResponse<{ rooms: TreatmentRoom[] }>>(
      '/admin/panchakarma/programs/rooms'
    );
  }

  listByStaff(staffCode: string) {
    return axiosInstance.get<ApiResponse<{ programs: HmsPanchakarmaProgram[] }>>(
      `/admin/panchakarma/programs/staff/${encodeURIComponent(staffCode)}`
    );
  }

  listByPatient(patientCode: string) {
    return axiosInstance.get<ApiResponse<{ programs: HmsPanchakarmaProgram[] }>>(
      `/admin/panchakarma/programs/patient/${encodeURIComponent(patientCode)}`
    );
  }

  getProgram(programCode: string) {
    return axiosInstance.get<ApiResponse<{ program: HmsPanchakarmaProgram }>>(
      `/admin/panchakarma/programs/${encodeURIComponent(programCode)}`
    );
  }

  create(values: ScheduleProgramFormValues) {
    const payload: Record<string, unknown> = {
      patientCode: values.patientId,
      therapy: values.therapy,
      totalDays: values.totalDays,
      roomCode: values.roomCode,
      startDate: values.startDate,
    };
    if (values.therapistId) payload.staffCode = values.therapistId;
    if (values.treatmentName?.trim()) payload.treatmentName = values.treatmentName.trim();
    if (values.totalFees?.trim()) payload.totalFees = Number(values.totalFees);
    return axiosInstance.post<ApiResponse<{ program: HmsPanchakarmaProgram }>>(
      '/admin/panchakarma/programs',
      payload
    );
  }

  attendProgram(programCode: string, payload: ProgramAttendPayload) {
    return axiosInstance.post<ApiResponse<{ program: HmsPanchakarmaProgram }>>(
      `/admin/panchakarma/programs/${encodeURIComponent(programCode)}/attend`,
      {
        treatmentName: payload.treatmentName,
        totalFees: payload.totalFees,
        dailySessions: payload.dailySessions.map((row) => ({
          dayNumber: row.dayNumber,
          sessionDate: row.sessionDate || undefined,
          time: row.time,
          duration: row.duration,
          panchakarmaType: row.panchakarmaType,
          medicineContent: row.medicineContent,
        })),
      }
    );
  }

  createTreatmentPlan(
    appointmentCode: string,
    payload: {
      treatmentName: string;
      totalFees: number;
      totalDays: number;
      therapy?: string;
      startDate?: string;
      room?: string;
      dailySessions: Array<{
        dayNumber: number;
        sessionDate?: string;
        time?: string;
        duration?: string;
        panchakarmaType?: string;
        medicineContent?: string;
      }>;
      markPaid?: boolean;
      paymentMethod?: 'Cash' | 'UPI' | 'Card';
      payAmount?: number;
    }
  ) {
    return axiosInstance.post<
      ApiResponse<{ program: HmsPanchakarmaProgram; invoice: import('@/types/billing.types').InvoiceDetail }>
    >(`/admin/panchakarma/appointments/${encodeURIComponent(appointmentCode)}/treatment-plan`, payload);
  }
}

export const panchakarmaAdminService = new PanchakarmaAdminService();
