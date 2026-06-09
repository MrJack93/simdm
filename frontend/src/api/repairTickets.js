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

export const updateTicketStatus = (id, status) =>
  api.patch(`/repair-tickets/${id}/status`, { status }).then((r) => r.data);

export const updateRepairTicket = (id, data) =>
  api.patch(`/repair-tickets/${id}`, data).then((r) => r.data);
