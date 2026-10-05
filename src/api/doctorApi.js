import request from './request';

export const doctorApi = {
  getAll: () => request('/doctors'),
  getById: (id) => request(`/doctors/${id}`),
  create: (data) => request('/doctors', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/doctors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/doctors/${id}`, { method: 'DELETE' }),
};
