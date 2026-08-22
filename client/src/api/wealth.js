import api from './axios';

export const wealthAPI = {
  getNetWorth: () => api.get('/wealth/net-worth'),
  getHistory: (params) => api.get('/wealth/history', { params }),
  getAssets: () => api.get('/wealth/assets'),
  createAsset: (data) => api.post('/wealth/assets', data),
  updateAsset: (id, data) => api.put(`/wealth/assets/${id}`, data),
  deleteAsset: (id) => api.delete(`/wealth/assets/${id}`),
};
