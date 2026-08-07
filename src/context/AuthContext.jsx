import { createContext, useContext, useState, useEffect } from 'react';
import { USER_KEY } from '../utils/constants';
import { login as authLogin, register as authRegister, getMe, logout as authLogout } from '../services/apiServices/authService';
import IdleTimer from '../components/common/IdleTimer';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
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

  const login = async (email, password) => {
    const { data } = await authLogin(email, password);
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    setUser(data);
    return data;
  };

  const register = async (formData) => {
    const { data } = await authRegister(formData);
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = async () => {
    try {
      await authLogout(); // Instruct backend to clear cookie
    } catch (e) {
      console.warn('Logout API failed, proceeding with local logout', e);
    }
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const hasRole = (...roles) => {
    return user && roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, hasRole }}>
      <IdleTimer />
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
