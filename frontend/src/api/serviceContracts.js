import api from './axios';

export const getProviders = () =>
  api.get('/service-contracts/providers').then((r) => r.data);

export const getProvider = (id) =>
  api.get(`/service-contracts/providers/${id}`).then((r) => r.data);

export const createProvider = (data) =>
  api.post('/service-contracts/providers', data).then((r) => r.data);

export const getContracts = (params = {}) => {
  const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const query = new URLSearchParams(filtered).toString();
  return api.get(`/service-contracts/contracts${query ? '?' + query : ''}`).then((r) => r.data);
};

export const createContract = (data) =>
  api.post('/service-contracts/contracts', data).then((r) => r.data);

export const rateProvider = (id, data) =>
  api.post(`/service-contracts/providers/${id}/rate`, data).then((r) => r.data);

export const getCostAnalysis = () =>
  api.get('/service-contracts/cost-analysis').then((r) => r.data);

export const deleteContract = (id) =>
  api.delete(`/service-contracts/contracts/${id}`).then((r) => r.data);

export const deleteProvider = (id) =>
  api.delete(`/service-contracts/providers/${id}`).then((r) => r.data);
