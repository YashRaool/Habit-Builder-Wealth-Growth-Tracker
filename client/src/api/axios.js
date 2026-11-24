import axios from 'axios';
import { handleOfflineRequest } from './offlineStore';

const configuredApiUrl = import.meta.env.VITE_API_URL;
// A remote cloud API is configured if VITE_API_URL is provided and starts with http(s)://
const hasRemoteApi = Boolean(
  configuredApiUrl && /^https?:\/\//i.test(configuredApiUrl)
);

const isStaticHosting =
  !hasRemoteApi &&
  typeof window !== 'undefined' &&
  (window.location.hostname.includes('github.io') ||
   window.location.protocol === 'file:' ||
   !window.location.port ||
   window.location.hostname !== 'localhost');

const api = axios.create({
  baseURL: configuredApiUrl || '/api',
  timeout: 60000, // 60 s — Render cold-start allowance
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF guard signal
  },
});

// Attach JWT token to every request and route to offline store ONLY if no remote API configured and running on static hosting
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('fht_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Fast-path instant response ONLY when NO remote cloud API is configured
  if (isStaticHosting) {
    config.adapter = async () => {
      const data = await handleOfflineRequest(config);
      return {
        data: { success: true, data },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };
  }

  return config;
});

// Global response error handler with graceful local fallback ONLY if no remote cloud API is configured
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // ONLY use localStorage fallback when NO remote cloud API is configured
    if (!hasRemoteApi) {
      const isNetworkOrOffline =
        !error.response ||
        error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNABORTED' ||
        error.response.status === 404 ||
        error.response.status >= 500;

      if (isNetworkOrOffline && error.config) {
        try {
          const fallbackData = await handleOfflineRequest(error.config);
          if (fallbackData !== undefined) {
            return {
              data: { success: true, data: fallbackData },
              status: 200,
              statusText: 'OK',
              config: error.config,
              headers: {},
            };
          }
        } catch (offlineErr) {
          console.warn('Offline fallback handler error:', offlineErr);
        }
      }
    }

    if (error.response?.status === 401) {
      const isAuthEndpoint =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/register') ||
        error.config?.url?.includes('/auth/google');
      const isLoginPage =
        typeof window !== 'undefined' && window.location.pathname.includes('/login');

      if (!isAuthEndpoint && !isLoginPage) {
        localStorage.removeItem('fht_token');
        localStorage.removeItem('fht_user');
        window.location.href = './login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
