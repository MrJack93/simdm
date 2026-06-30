import api from './axios';

export const documentKeys = {
  all: ['documents'],
  list: (filters) => ['documents', 'list', filters],
  detail: (id) => ['documents', 'detail', id],
  categories: ['documents', 'categories'],
};

export const fetchDocuments = async (search = '', filters = {}, page = 1, limit = 50) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });
  params.append('page', page);
  params.append('limit', limit);
  const { data } = await api.get(`/documents?${params.toString()}`);
  return data;
};

export const fetchDocument = async (id) => {
  const { data } = await api.get(`/documents/${id}`);
  return data;
};

export const fetchDocumentCategories = async () => {
  const { data } = await api.get('/documents/categories');
  return data;
};

export const createDocument = async (formData) => {
  const { data } = await api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const createDocumentVersion = async (id, formData) => {
  const { data } = await api.post(`/documents/${id}/version`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const updateDocument = async (id, updates) => {
  const { data } = await api.put(`/documents/${id}`, updates);
  return data;
};

export const deleteDocument = async (id) => {
  const { data } = await api.delete(`/documents/${id}`);
  return data;
};

export const verifyDocument = async (id) => {
  const { data } = await api.get(`/documents/${id}/verify`);
  return data;
};

export const fetchDocumentAccessLog = async (id, page = 1, limit = 50) => {
  const { data } = await api.get(`/documents/${id}/access-log?page=${page}&limit=${limit}`);
  return data;
};

export const fetchExpiringDocuments = async (days = 60) => {
  const { data } = await api.get(`/documents/expiring?days=${days}`);
  return data;
};
