import api from './axios';

export const executeMpp = (data) =>
  api.post('/mpp-executions', data).then((r) => r.data);

export const getMppExecution = (id) =>
  api.get(`/mpp-executions/${id}`).then((r) => r.data);

export const downloadFormular6 = (id) =>
  api.get(`/mpp-executions/${id}/formular6-pdf`, { responseType: 'blob' }).then((r) => r.data);
