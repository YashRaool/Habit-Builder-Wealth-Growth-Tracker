import api from './axios';

export const adminAPI = {
  getMetrics: () => api.get('/admin/metrics'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  getFeedback: (params) => api.get('/admin/feedback', { params }),
  updateFeedback: (id, data) => api.put(`/admin/feedback/${id}`, data),
  submitFeedback: (data) => api.post('/admin/feedback', data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};
