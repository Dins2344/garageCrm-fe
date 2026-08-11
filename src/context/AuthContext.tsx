import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { USER_KEY, ACTIVE_GARAGE_KEY } from '../utils/constants';
import { login as authLogin, register as authRegister, getMe, logout as authLogout, type RegisterFormData } from '../services/apiServices/authService';
import IdleTimer from '../components/common/IdleTimer';
import type { User, Role } from '../types/models';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (formData: RegisterFormData) => Promise<User>;
  logout: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to fetch current user on mount to verify cookie is valid
    getMe()
      .then(res => {
        setUser(res.data);
        localStorage.setItem(USER_KEY, JSON.stringify(res.data));
      })
      .catch(() => {
        // No valid session cookie found or expired
        setUser(null);
        localStorage.removeItem(USER_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const { data } = await authLogin(email, password);
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    setUser(data);
    return data;
  };

  const register = async (formData: RegisterFormData): Promise<User> => {
    const { data } = await authRegister(formData);
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = async (): Promise<void> => {
    try {
      await authLogout(); // Instruct backend to clear cookie
    } catch (e) {
      console.warn('Logout API failed, proceeding with local logout', e);
    }
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ACTIVE_GARAGE_KEY);
    setUser(null);
  };

  const hasRole = (...roles: Role[]): boolean => {
    return !!user && roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, hasRole }}>
      <IdleTimer />
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
