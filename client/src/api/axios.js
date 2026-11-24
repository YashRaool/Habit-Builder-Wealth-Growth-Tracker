import axios from 'axios';
import { handleOfflineRequest } from './offlineStore';

const RENDER_API_URL = 'https://habit-builder-wealth-growth-tracker.onrender.com/api';

const isGithubPages =
  typeof window !== 'undefined' &&
  window.location.hostname.includes('yashraool.github.io');

// Always guarantee live cloud backend when running on GitHub Pages
const resolveBaseURL = () => {
  if (isGithubPages) {
    return RENDER_API_URL;
  }
  return import.meta.env.VITE_API_URL || '/api';
};

const activeBaseURL = resolveBaseURL();
const hasRemoteApi = /^https?:\/\//i.test(activeBaseURL);

const isStaticHosting =
  !hasRemoteApi &&
  typeof window !== 'undefined' &&
  (window.location.protocol === 'file:' ||
   !window.location.port ||
   window.location.hostname !== 'localhost');

// ── Render Cold-Start Subtle Notification ────────────────────────────────────
let pendingSlowRequests = 0;
let coldStartElement = null;

function showColdStartHint() {
  if (typeof document === 'undefined') return;
  if (!coldStartElement) {
    coldStartElement = document.createElement('div');
    coldStartElement.id = 'render-cold-start-hint';
    coldStartElement.setAttribute('role', 'status');
    coldStartElement.setAttribute('aria-live', 'polite');
    coldStartElement.style.cssText = [
      'position: fixed',
      'bottom: 24px',
      'right: 24px',
      'z-index: 99999',
      'background: rgba(15, 23, 42, 0.92)',
      'color: #ffffff',
      'padding: 10px 18px',
      'border-radius: 9999px',
      'font-size: 13px',
      'font-weight: 500',
      'font-family: inherit',
      'box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
      'backdrop-filter: blur(8px)',
      '-webkit-backdrop-filter: blur(8px)',
      'display: flex',
      'align-items: center',
      'gap: 10px',
      'pointer-events: none',
      'border: 1px solid rgba(255, 255, 255, 0.1)',
      'transition: opacity 0.25s ease, transform 0.25s ease',
      'opacity: 0',
      'transform: translateY(10px)',
    ].join(';');

    coldStartElement.innerHTML = `
      <style>@keyframes fhtSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }</style>
      <svg style="width: 14px; height: 14px; animation: fhtSpin 1s linear infinite;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle style="opacity: 0.25;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path style="opacity: 0.75;" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>
      <span>Connecting to cloud server...</span>
    `;
    document.body.appendChild(coldStartElement);
    requestAnimationFrame(() => {
      if (coldStartElement) {
        coldStartElement.style.opacity = '1';
        coldStartElement.style.transform = 'translateY(0)';
      }
    });
  }
}

function hideColdStartHint() {
  if (coldStartElement) {
    coldStartElement.style.opacity = '0';
    coldStartElement.style.transform = 'translateY(10px)';
    setTimeout(() => {
      if (pendingSlowRequests === 0 && coldStartElement && coldStartElement.parentNode) {
        coldStartElement.parentNode.removeChild(coldStartElement);
        coldStartElement = null;
      }
    }, 250);
  }
}

const cleanupColdStartTimer = (config) => {
  if (config?._coldStartTimer) {
    clearTimeout(config._coldStartTimer);
    delete config._coldStartTimer;
  }
};

const handleRequestFinished = (config) => {
  cleanupColdStartTimer(config);
  if (config?._didTriggerSlowHint) {
    delete config._didTriggerSlowHint;
    if (pendingSlowRequests > 0) {
      pendingSlowRequests--;
      if (pendingSlowRequests === 0) {
        hideColdStartHint();
      }
    }
  }
};

const api = axios.create({
  baseURL: activeBaseURL,
  timeout: 60000, // 60 s — Render cold-start allowance
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF guard signal
  },
});

// Attach JWT token to every request and monitor cold-start duration
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
  } else {
    // Start cold-start notification timer (>4s)
    config._coldStartTimer = setTimeout(() => {
      config._didTriggerSlowHint = true;
      pendingSlowRequests++;
      showColdStartHint();
    }, 4000);
  }

  return config;
});

// Global response error handler with graceful local fallback ONLY if no remote cloud API is configured
api.interceptors.response.use(
  (response) => {
    handleRequestFinished(response.config);
    return response;
  },
  async (error) => {
    handleRequestFinished(error.config);

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
