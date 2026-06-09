import api from './axios';

export const getMaintenancePlans = (params = {}) => {
  const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const query = new URLSearchParams(filtered).toString();
  return api.get(`/maintenance-plans/calendar${query ? '?' + query : ''}`).then((r) => r.data);
};

export const createMaintenancePlan = (data) =>
  api.post('/maintenance-plans/generate', data).then((r) => r.data);

export const getMaintenancePlan = (id) =>
  api.get(`/maintenance-plans/${id}`).then((r) => r.data);

export const rescheduleOccurrence = (id, data) =>
  api.patch(`/maintenance-plans/occurrence/${id}/reschedule`, data).then((r) => r.data);

export const downloadFormular5 = (year) =>
  api.get(`/maintenance-plans/${year}/formular5-pdf`, { responseType: 'blob' }).then((r) => r.data);
