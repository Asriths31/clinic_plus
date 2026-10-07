import api from './request';

export const appointmentApi = {
  getAll: (date) => api.get(`/appointments${date ? `?date=${date}` : ''}`),
  getById: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  delete: (id) => api.delete(`/appointments/${id}`),
};
