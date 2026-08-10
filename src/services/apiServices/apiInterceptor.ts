import axios from 'axios';
import { API_BASE_URL, USER_KEY } from '../../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor (can be used for other headers later)
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl: string = error.config?.url || '';

    // Auth endpoints intentionally return 401 on bad credentials or missing cookies.
    // Do NOT redirect — let the calling code handle the error.
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/changepassword') ||
      requestUrl.includes('/auth/updatepassword') ||
      requestUrl.includes('/auth/me') ||
      requestUrl.includes('/auth/logout');

    if (status === 401 && !isAuthEndpoint) {
      // Token is missing or expired — clear session and redirect to login
      localStorage.removeItem(USER_KEY);
      if (window.location.pathname !== '/login' && window.location.pathname !== '/home') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
