/**
 * API layer pentru resursă Consumables.
 */
import api from './axios';

export const consumableKeys = {
  all: ['consumables'],
  list: (filters) => ['consumables', 'list', filters],
  stats: ['consumables', 'stats'],
};

/**
 * Fetch all consumables.
 * @returns {Promise<Object>}
 */
export const fetchConsumables = async () => {
  const { data } = await api.get('/consumables');
  return data;
};

/**
 * Fetch consumables with pagination and filters.
 * @param {string} search
 * @param {Object} filters
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<Object>}
 */
export const fetchConsumablesWithFilters = async (search = '', filters = {}, page = 1, limit = 20) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });
  params.append('page', page);
  params.append('limit', limit);
  const { data } = await api.get(`/consumables?${params.toString()}`);
  return data;
};

/**
 * Fetch consumable statistics (low stock count, etc).
 * @returns {Promise<Object>}
 */
export const fetchConsumableStats = async () => {
  const { data } = await api.get('/consumables');
  const consumables = data.consumables || [];
  return { lowStock: consumables.filter(c => c.currentQuantity <= c.minimumQuantity).length };
};

/**
 * Delete consumable.
 * @param {number} id
 * @returns {Promise<void>}
 */
export const deleteConsumable = async (id) => {
  await api.delete(`/consumables/${id}`);
};
