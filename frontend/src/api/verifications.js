import api from './axios';

export const getVerifications = (params = {}) => {
  const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const query = new URLSearchParams(filtered).toString();
  return api.get(`/verifications${query ? '?' + query : ''}`).then((r) => r.data);
};

export const getVerification = (id) =>
  api.get(`/verifications/${id}`).then((r) => r.data);

export const uploadVerification = (data) =>
  api.post('/verifications', data).then((r) => r.data);

export const getComplianceReport = () =>
  api.get('/verifications/compliance-report').then((r) => r.data);

export const deleteVerification = (id) =>
  api.delete(`/verifications/${id}`).then((r) => r.data);
