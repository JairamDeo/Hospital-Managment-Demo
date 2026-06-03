import axiosInstance from '../http/axiosInstance';
import type { ApiResponse, MasterItem } from '@/types/api.types';

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

  portalMasters() {
    return axiosInstance.get<
      ApiResponse<{ prakriti: MasterItem[]; treatments: MasterItem[] }>
    >('/patient-portal/masters');
  }
}

export const masterService = new MasterService();
