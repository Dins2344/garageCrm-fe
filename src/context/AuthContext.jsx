import { createContext, useContext, useState, useEffect } from 'react';
import { login as authLogin, register as authRegister, getMe } from '../services/apiServices/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('garageflow_token');
    const savedUser = localStorage.getItem('garageflow_user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Verify token is still valid
      getMe()
        .then(res => {
          setUser(res.data);
          localStorage.setItem('garageflow_user', JSON.stringify(res.data));
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
    localStorage.setItem('garageflow_token', token);
    localStorage.setItem('garageflow_user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const register = async (formData) => {
    const { token, data } = await authRegister(formData);
    localStorage.setItem('garageflow_token', token);
    localStorage.setItem('garageflow_user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('garageflow_token');
    localStorage.removeItem('garageflow_user');
    setUser(null);
  };

  const hasRole = (...roles) => {
    return user && roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
