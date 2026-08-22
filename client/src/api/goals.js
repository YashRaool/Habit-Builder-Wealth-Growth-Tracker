import api from './axios';

export const goalsAPI = {
  getAll: (params) => api.get('/goals', { params }),
  getOne: (id) => api.get(`/goals/${id}`),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
  contribute: (id, data) => api.post(`/goals/${id}/contribute`, data),
};
