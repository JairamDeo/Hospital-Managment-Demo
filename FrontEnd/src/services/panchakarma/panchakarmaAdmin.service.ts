import axiosInstance from '../http/axiosInstance';
import type { ApiResponse, HmsPanchakarmaProgram } from '@/types/api.types';
import type {
  PanchakarmaStats,
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

  create(values: ScheduleProgramFormValues) {
    return axiosInstance.post<ApiResponse<{ program: HmsPanchakarmaProgram }>>(
      '/admin/panchakarma/programs',
      {
        patientCode: values.patientId,
        staffCode: values.therapistId,
        therapy: values.therapy,
        totalDays: values.totalDays,
        room: values.room,
        startDate: values.startDate,
      }
    );
  }
}

export const panchakarmaAdminService = new PanchakarmaAdminService();
