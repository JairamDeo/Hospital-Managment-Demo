import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authService } from '@/services/auth/authService';
import { authStorage } from '@/store/authStorage';
import type { AdminUser } from '@/types/api.types';

interface AuthContextValue {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ message: string; user: AdminUser }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persist = useCallback((t: string, u: AdminUser) => {
    authStorage.set({ token: t, user: u });
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    authStorage.clear();
    setToken(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await authService.getProfile();
    if (data.res?.user) {
      const stored = authStorage.get();
      if (stored?.token) {
        persist(stored.token, data.res.user);
      }
    }
  }, [persist]);

  useEffect(() => {
    const init = async () => {
      const stored = authStorage.get();
      if (!stored?.token) {
        setIsLoading(false);
        return;
      }
      setToken(stored.token);
      setUser(stored.user);
      try {
        const { data } = await authService.getProfile();
        if (data.res?.user) {
          persist(stored.token, data.res.user);
        }
      } catch {
        logout();
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [logout, persist]);

  const login = useCallback(
    async (email: string, password: string) => {
      authStorage.clear();
      setToken(null);
      setUser(null);

      const { data } = await authService.login(email, password);
      if (!data.res?.token || !data.res?.user) {
        throw new Error(data.message || 'Login failed');
      }
      persist(data.res.token, data.res.user);
      return { message: data.message, user: data.res.user };
    },
    [persist]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isLoading,
      login,
      logout,
      refreshProfile,
    }),
    [user, token, isLoading, login, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
};
