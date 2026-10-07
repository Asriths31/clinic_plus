import axiosInstance from './request';

export const appointmentApi = {
  getAll: (date) => axiosInstance.get(`/appointments${date ? `?date=${date}` : ''}`),
  getById: (id) => axiosInstance.get(`/appointments/${id}`),
  create: (data) => axiosInstance.post('/appointments', data),
  update: (id, data) => axiosInstance.put(`/appointments/${id}`, data),
  delete: (id) => axiosInstance.delete(`/appointments/${id}`),
};
