import axios from 'axios';
import { API_BASE_URL, TOKEN_KEY, USER_KEY } from '../../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor — inject JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';

    // Auth endpoints intentionally return 401 on bad credentials (wrong password,
    // invalid login, etc.). Do NOT redirect — let the calling code handle the error.
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/changepassword') ||
      requestUrl.includes('/auth/updatepassword');

    if (status === 401 && !isAuthEndpoint) {
      // Token is missing or expired — clear session and redirect to login
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
