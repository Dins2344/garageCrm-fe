import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Admin specific interceptor for its own token
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('garageflow_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const adminLogin = async (email, password) => {
  const res = await adminApi.post('/login', { email, password });
  return res.data;
};

export const verifyAdmin = async () => {
  const res = await adminApi.get('/verify');
  return res.data;
};

export const getAdminStats = async () => {
  const res = await adminApi.get('/stats');
  return res.data;
};

export const getAllGarages = async () => {
  const res = await adminApi.get('/garages');
  return res.data;
};

export const getAllUsers = async () => {
  const res = await adminApi.get('/users');
  return res.data;
};

export const getSystemHealth = async () => {
  const res = await adminApi.get('/health');
  return res.data;
};

export default adminApi;
