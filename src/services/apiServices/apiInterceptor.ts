import axios from 'axios';
import { API_BASE_URL, USER_KEY, ACTIVE_GARAGE_KEY, AUTH_EXPIRED_EVENT } from '../../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attaches the owner's currently-selected garage (branch) to every request.
// Ignored server-side for non-owner roles, so it's safe to always send.
api.interceptors.request.use(
  (config) => {
    const garageId = localStorage.getItem(ACTIVE_GARAGE_KEY);
    if (garageId) {
      config.headers['X-Garage-Id'] = garageId;
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
      // Token is missing or expired. Clearing USER_KEY also fires the
      // `storage` event in every other tab, so they sign out together;
      // AuthContext handles this tab. No hard reload — ProtectedRoute
      // navigates once the user is null.
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(ACTIVE_GARAGE_KEY);
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }

    return Promise.reject(error);
  }
);

export default api;
