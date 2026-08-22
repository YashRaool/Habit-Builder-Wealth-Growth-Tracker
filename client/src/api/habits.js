import api from './axios';

export const habitsAPI = {
  getAll: (params) => api.get('/habits', { params }),
  getOne: (id) => api.get(`/habits/${id}`),
  create: (data) => api.post('/habits', data),
  update: (id, data) => api.put(`/habits/${id}`, data),
  delete: (id) => api.delete(`/habits/${id}`),
  checkIn: (id, data) => api.post(`/habits/${id}/checkin`, data),
  getHistory: (id) => api.get(`/habits/${id}/history`),
};
