import axios from 'axios';
import { API_BASE_URL, PRODUCTION_API_ORIGIN } from '../config/urls';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

function refreshBaseURL() {
  if (api.defaults.baseURL && String(api.defaults.baseURL).length > 0) {
    return api.defaults.baseURL;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return PRODUCTION_API_ORIGIN;
}

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken }, { baseURL: refreshBaseURL() });
          const newToken = data?.data?.accessToken ?? data?.accessToken;
          localStorage.setItem('accessToken', newToken);
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
