import axiosInstance from './request';

export const patientApi = {
  getAll: () => axiosInstance.get('/patients'),
  getById: (id) => axiosInstance.get(`/patients/${id}`),
  create: (data) => axiosInstance.post('/patients', data),
  update: (id, data) => axiosInstance.put(`/patients/${id}`, data),
  delete: (id) => axiosInstance.delete(`/patients/${id}`),
};
