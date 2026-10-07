import axiosInstance from './request';

export const doctorApi = {
  getAll: () => axiosInstance.get('/doctors'),
  getById: (id) => axiosInstance.get(`/doctors/${id}`),
  create: (data) => axiosInstance.post('/doctors', data),
  update: (id, data) => axiosInstance.put(`/doctors/${id}`, data),
  delete: (id) => axiosInstance.delete(`/doctors/${id}`),
};
