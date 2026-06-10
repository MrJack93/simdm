import api from './axios';

export const getRepairTickets = (params = {}) => {
  const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const query = new URLSearchParams(filtered).toString();
  return api.get(`/repair-tickets${query ? '?' + query : ''}`).then((r) => r.data);
};

export const getRepairTicket = (id) =>
  api.get(`/repair-tickets/${id}`).then((r) => r.data);

export const createRepairTicket = (data) =>
  api.post('/repair-tickets', data).then((r) => r.data);

// Backend expects { newStatus }
export const updateTicketStatus = (id, newStatus) =>
  api.patch(`/repair-tickets/${id}/status`, { newStatus }).then((r) => r.data);

export const triageTicket = (id, data) =>
  api.patch(`/repair-tickets/${id}/triage`, data).then((r) => r.data);

export const submitRepair = (id, data) =>
  api.put(`/repair-tickets/${id}/repair`, data).then((r) => r.data);

export const downloadFormular7Pdf = (params = {}) => {
  const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v));
  const query = new URLSearchParams(filtered).toString();
  return api
    .get(`/repair-tickets/formular7-pdf${query ? '?' + query : ''}`, { responseType: 'blob' })
    .then((r) => r.data);
};

export const downloadFormular8Pdf = (id) =>
  api
    .get(`/repair-tickets/${id}/formular8-pdf`, { responseType: 'blob' })
    .then((r) => r.data);

export const downloadFormular9Pdf = (id) =>
  api
    .get(`/repair-tickets/${id}/handover-pdf`, { responseType: 'blob' })
    .then((r) => r.data);
