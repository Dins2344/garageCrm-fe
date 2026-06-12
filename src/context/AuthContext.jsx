import { createContext, useContext, useState, useEffect } from 'react';
import { TOKEN_KEY, USER_KEY } from '../utils/constants';
import { login as authLogin, register as authRegister, getMe } from '../services/apiServices/authService';
import IdleTimer from '../components/common/IdleTimer';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Verify token is still valid
      getMe()
        .then(res => {
          setUser(res.data);
          localStorage.setItem(USER_KEY, JSON.stringify(res.data));
        })
        .catch(() => {
          logout();
          // Session expired — redirect to public landing
          if (window.location.pathname !== '/home' && window.location.pathname !== '/login') {
            window.location.href = '/home';
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { token, data } = await authLogin(email, password);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    setUser(data);
    return data;
  };

  const register = async (formData) => {
    const { token, data } = await authRegister(formData);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
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
