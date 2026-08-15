import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { patientPortalAuthService } from '@/services/auth/patientPortalAuth.service';
import { patientAuthStorage } from '@/store/patientAuthStorage';
import type { PatientUser } from '@/types/api.types';

interface PatientPortalAuthContextValue {
  patient: PatientUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  persistSession: (token: string, patient: PatientUser) => void;
  refreshProfile: () => Promise<void>;
}

const PatientPortalAuthContext = createContext<PatientPortalAuthContextValue | undefined>(
  undefined
);

export const PatientPortalAuthProvider = ({ children }: { children: ReactNode }) => {
  const [patient, setPatient] = useState<PatientUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistSession = useCallback((t: string, p: PatientUser) => {
    patientAuthStorage.set({ token: t, patient: p });
    setToken(t);
    setPatient(p);
  }, []);

  const logout = useCallback(() => {
    patientAuthStorage.clear();
    setToken(null);
    setPatient(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await patientPortalAuthService.getProfile();
    if (data.res?.patient) {
      const stored = patientAuthStorage.get();
      if (stored?.token) {
        persistSession(stored.token, data.res.patient);
      }
    }
  }, [persistSession]);

  useEffect(() => {
    const init = async () => {
      const stored = patientAuthStorage.get();
      if (!stored?.token) {
        setIsLoading(false);
        return;
      }
      setToken(stored.token);
      setPatient(stored.patient);
      try {
        const { data } = await patientPortalAuthService.getProfile();
        if (data.res?.patient) {
          persistSession(stored.token, data.res.patient);
        }
      } catch {
        logout();
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [logout, persistSession]);

  const value = useMemo(
    () => ({
      patient,
      token,
      isAuthenticated: Boolean(token),
      isLoading,
      logout,
      persistSession,
      refreshProfile,
    }),
    [patient, token, isLoading, logout, persistSession, refreshProfile]
  );

  return (
    <PatientPortalAuthContext.Provider value={value}>{children}</PatientPortalAuthContext.Provider>
  );
};

export const usePatientPortalAuthContext = () => {
  const ctx = useContext(PatientPortalAuthContext);
  if (!ctx) {
    throw new Error('usePatientPortalAuthContext must be used within PatientPortalAuthProvider');
  }
  return ctx;
};
