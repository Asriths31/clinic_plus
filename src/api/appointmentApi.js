import request from './request';

export const appointmentApi = {
  getAll: (date) => request(`/appointments${date ? `?date=${date}` : ''}`),
  getById: (id) => request(`/appointments/${id}`),
  create: (data) => request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/appointments/${id}`, { method: 'DELETE' }),
};
