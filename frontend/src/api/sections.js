/**
 * API layer pentru resursă Sections.
 */
import api from './axios';

export const sectionKeys = {
  all: ['sections'],
};

export const fetchSections = async () => {
  const { data } = await api.get('/sections');
  return data;
};
