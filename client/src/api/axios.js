import { api } from '@/lib/api';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? '/api'
    : 'https://wealthhabit-backend.onrender.com/api');

export { api };
export default api;
