import axiosInstance from '../http/axiosInstance';
import type { ApiResponse, MasterItem, PharmacySpoonItem, RoomMasterItem, AppointmentSlotItem } from '@/types/api.types';

class MasterService {
  listPrakriti() {
    return axiosInstance.get<ApiResponse<{ items: MasterItem[] }>>('/admin/master/prakriti');
  }

  createPrakriti(name: string) {
    return axiosInstance.post<ApiResponse<{ item: MasterItem }>>('/admin/master/prakriti', { name });
  }

  updatePrakriti(id: string, payload: { name?: string; active?: boolean }) {
    return axiosInstance.patch<ApiResponse<{ item: MasterItem }>>(
      `/admin/master/prakriti/${id}`,
      payload
    );
  }

  listTreatments() {
    return axiosInstance.get<ApiResponse<{ items: MasterItem[] }>>('/admin/master/treatments');
  }

  createTreatment(name: string) {
    return axiosInstance.post<ApiResponse<{ item: MasterItem }>>('/admin/master/treatments', {
      name,
    });
  }

  updateTreatment(id: string, payload: { name?: string; active?: boolean }) {
    return axiosInstance.patch<ApiResponse<{ item: MasterItem }>>(
      `/admin/master/treatments/${id}`,
      payload
    );
  }

  listPharmacyCategories(activeOnly = false) {
    const query = activeOnly ? '?active=true' : '';
    return axiosInstance.get<ApiResponse<{ items: MasterItem[] }>>(
      `/admin/master/pharmacy-categories${query}`
    );
  }

  createPharmacyCategory(name: string) {
    return axiosInstance.post<ApiResponse<{ item: MasterItem }>>(
      '/admin/master/pharmacy-categories',
      { name }
    );
  }

  updatePharmacyCategory(id: string, payload: { name?: string; active?: boolean }) {
    return axiosInstance.patch<ApiResponse<{ item: MasterItem }>>(
      `/admin/master/pharmacy-categories/${id}`,
      payload
    );
  }

  listPharmacyUnits(activeOnly = false) {
    const query = activeOnly ? '?active=true' : '';
    return axiosInstance.get<ApiResponse<{ items: MasterItem[] }>>(
      `/admin/master/pharmacy-units${query}`
    );
  }

  createPharmacyUnit(name: string) {
    return axiosInstance.post<ApiResponse<{ item: MasterItem }>>(
      '/admin/master/pharmacy-units',
      { name }
    );
  }

  updatePharmacyUnit(id: string, payload: { name?: string; active?: boolean }) {
    return axiosInstance.patch<ApiResponse<{ item: MasterItem }>>(
      `/admin/master/pharmacy-units/${id}`,
      payload
    );
  }

  listPharmacySpoons(activeOnly = false) {
    const query = activeOnly ? '?active=true' : '';
    return axiosInstance.get<ApiResponse<{ items: PharmacySpoonItem[] }>>(
      `/admin/master/pharmacy-spoons${query}`
    );
  }

  createPharmacySpoon(payload: { name: string; grams: number }) {
    return axiosInstance.post<ApiResponse<{ item: PharmacySpoonItem }>>(
      '/admin/master/pharmacy-spoons',
      payload
    );
  }

  setDefaultPharmacySpoon(id: string) {
    return axiosInstance.post<ApiResponse<{ item: PharmacySpoonItem }>>(
      `/admin/master/pharmacy-spoons/${id}/default`
    );
  }

  listRooms(activeOnly = false, roomType?: 'IPD' | 'Panchakarma') {
    const params = new URLSearchParams();
    if (activeOnly) params.set('active', 'true');
    if (roomType) params.set('roomType', roomType);
    const query = params.toString() ? `?${params.toString()}` : '';
    return axiosInstance.get<ApiResponse<{ items: RoomMasterItem[] }>>(
      `/admin/master/rooms${query}`
    );
  }

  createRoom(payload: {
    roomNumber: string;
    name: string;
    roomType: 'IPD' | 'Panchakarma';
    capacity: number;
  }) {
    return axiosInstance.post<ApiResponse<{ item: RoomMasterItem }>>('/admin/master/rooms', payload);
  }

  updateRoom(
    id: string,
    payload: Partial<{
      roomNumber: string;
      name: string;
      roomType: 'IPD' | 'Panchakarma';
      capacity: number;
      active: boolean;
    }>
  ) {
    return axiosInstance.patch<ApiResponse<{ item: RoomMasterItem }>>(
      `/admin/master/rooms/${id}`,
      payload
    );
  }

  listLabCategories(activeOnly = false) {
    const query = activeOnly ? '?active=true' : '';
    return axiosInstance.get<ApiResponse<{ items: MasterItem[] }>>(
      `/admin/master/lab-categories${query}`
    );
  }

  createLabCategory(name: string) {
    return axiosInstance.post<ApiResponse<{ item: MasterItem }>>('/admin/master/lab-categories', {
      name,
    });
  }

  updateLabCategory(id: string, payload: { name?: string; active?: boolean }) {
    return axiosInstance.patch<ApiResponse<{ item: MasterItem }>>(
      `/admin/master/lab-categories/${id}`,
      payload
    );
  }

  listLabTests(activeOnly = false, categoryId?: string) {
    const params = new URLSearchParams();
    if (activeOnly) params.set('active', 'true');
    if (categoryId) params.set('categoryId', categoryId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return axiosInstance.get<
      ApiResponse<{
        items: Array<MasterItem & { categoryCode?: string; categoryName?: string; category?: string }>;
      }>
    >(`/admin/master/lab-tests${query}`);
  }

  createLabTest(payload: { name: string; categoryId: string }) {
    return axiosInstance.post<
      ApiResponse<{
        item: MasterItem & { categoryCode?: string; categoryName?: string };
      }>
    >('/admin/master/lab-tests', payload);
  }

  updateLabTest(
    id: string,
    payload: { name?: string; categoryId?: string; active?: boolean }
  ) {
    return axiosInstance.patch<ApiResponse<{ item: MasterItem }>>(
      `/admin/master/lab-tests/${id}`,
      payload
    );
  }

  listAppointmentSlots(activeOnly = false) {
    const query = activeOnly ? '?active=true' : '';
    return axiosInstance.get<ApiResponse<{ items: AppointmentSlotItem[] }>>(
      `/admin/master/appointment-slots${query}`
    );
  }

  createAppointmentSlot(time: string, maxAppointments = 1) {
    return axiosInstance.post<ApiResponse<{ item: AppointmentSlotItem }>>('/admin/master/appointment-slots', {
      time,
      maxAppointments,
    });
  }

  createAppointmentSlotsRange(payload: {
    startTime: string;
    endTime: string;
    gapMinutes: number;
    maxAppointments?: number;
  }) {
    return axiosInstance.post<
      ApiResponse<{
        created: AppointmentSlotItem[];
        skipped: string[];
        items: AppointmentSlotItem[];
      }>
    >('/admin/master/appointment-slots/range', payload);
  }

  updateAppointmentSlot(
    id: string,
    payload: { time?: string; active?: boolean; maxAppointments?: number }
  ) {
    return axiosInstance.patch<ApiResponse<{ item: AppointmentSlotItem }>>(
      `/admin/master/appointment-slots/${id}`,
      payload
    );
  }

  deleteAppointmentSlot(id: string) {
    return axiosInstance.delete<ApiResponse<{ item: AppointmentSlotItem }>>(
      `/admin/master/appointment-slots/${id}`
    );
  }

  portalMasters() {
    return axiosInstance.get<
      ApiResponse<{ prakriti: MasterItem[]; treatments: MasterItem[]; appointmentSlots: AppointmentSlotItem[] }>
    >('/patient-portal/masters');
  }
}

export const masterService = new MasterService();
