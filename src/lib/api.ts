import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL as string;

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('erp_token');
  // Only send if it looks like a real JWT
  if (token && token !== 'null' && token !== 'undefined' && token.split('.').length === 3) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err.response?.status;
    const url = err.config?.url || '';

    // Never log the user out because of a failed login attempt
    const isAuthEndpoint =
      url.includes('/api/auth/login') ||
      url.includes('/api/auth/forgot') ||
      url.includes('/api/auth/reset');

    // Only wipe + redirect if:
    //   - 401 occurred
    //   - it wasn't a login attempt
    //   - the user actually had a token (session expired)
    //   - and they're not already on /login
    if (
      status === 401 &&
      !isAuthEndpoint &&
      localStorage.getItem('erp_token') &&
      !location.pathname.startsWith('/login')
    ) {
      localStorage.removeItem('erp_token');
      localStorage.removeItem('erp_user');
      location.href = '/login';
    }

    return Promise.reject(err);
  }
);