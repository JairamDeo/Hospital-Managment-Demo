import { AUTH_STORAGE_KEY } from '@/constants/constants';
import type { AdminUser } from '@/types/api.types';

export interface StoredAuth {
  token: string;
  user: AdminUser;
}

export const authStorage = {
  get: (): StoredAuth | null => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as StoredAuth;
    } catch {
      return null;
    }
  },
  set: (data: StoredAuth) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  },
  clear: () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },
};
