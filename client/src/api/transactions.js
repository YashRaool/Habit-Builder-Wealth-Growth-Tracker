import api from './axios';

export const transactionsAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getSummary: (params) => api.get('/transactions/summary', { params }),
  getOne: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
};
