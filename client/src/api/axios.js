import axios from 'axios';

const fallbackBaseURL = import.meta.env.PROD
  ? 'https://wealthhabit-backend.onrender.com/api'
  : '/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || fallbackBaseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fht_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const serverMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      (error.code === 'ECONNABORTED' ? 'Request timed out. Please try again.' : null) ||
      error.message ||
      'Network request failed. Please check your connection.';

    if (error.response && typeof error.response.data === 'object' && error.response.data !== null) {
      error.response.data.message = serverMessage;
    }

    const requestUrl = error.config?.url || '';
    const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
    const isAuthPage =
      typeof window !== 'undefined' &&
      (window.location.pathname.endsWith('/login') || window.location.pathname.endsWith('/register'));

    if (error.response?.status === 401 && !isAuthEndpoint && !isAuthPage) {
      localStorage.removeItem('fht_token');
      localStorage.removeItem('fht_user');
      const basePath = import.meta.env.BASE_URL || '/';
      window.location.href = `${basePath.endsWith('/') ? basePath : basePath + '/'}login`;
    }

    return Promise.reject(error);
  }
);

export default api;
