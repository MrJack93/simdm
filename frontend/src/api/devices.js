/**
 * API layer pentru resursă Devices.
 * Centralizează fetch logic, query keys și transformări.
 */
import api from './axios';

export const deviceKeys = {
  all: ['devices'],
  list: (filters) => ['devices', 'list', filters],
  detail: (id) => ['device', id],
  inventory: ['devices', 'inventory'],
  consumables: ['devices', 'consumables'],
};

/**
 * Fetch all devices cu opțional filters.
 * @param {Object} [filters={}] - filters object (status, sectionId, search, etc.)
 * @returns {Promise<Object>} { devices, total, pages }
 */
export const fetchDevices = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });
  const { data } = await api.get(`/devices?${params.toString()}`);
  return data;
};

/**
 * Fetch single device by ID.
 * @param {number} id
 * @returns {Promise<Object>} device object
 */
export const fetchDevice = async (id) => {
  const { data } = await api.get(`/devices/${id}`);
  return data;
};

/**
 * Create new device.
 * @param {Object} payload - device data
 * @returns {Promise<Object>} created device
 */
export const createDevice = async (payload) => {
  const { data } = await api.post('/devices', payload);
  return data;
};

/**
 * Update device.
 * @param {number} id
 * @param {Object} payload - updated fields
 * @returns {Promise<Object>} updated device
 */
export const updateDevice = async (id, payload) => {
  const { data } = await api.patch(`/devices/${id}`, payload);
  return data;
};

/**
 * Delete device.
 * @param {number} id
 * @returns {Promise<void>}
 */
export const deleteDevice = async (id) => {
  await api.delete(`/devices/${id}`);
};

/**
 * Fetch annual inventory data.
 * @returns {Promise<Object>}
 */
export const fetchAnnualInventory = async () => {
  const { data } = await api.get('/devices/inventory/annual');
  return data;
};

/**
 * Fetch consumables (devices with consumable flag).
 * @returns {Promise<Array>}
 */
export const fetchConsumables = async () => {
  const { data } = await api.get('/devices/consumables');
  return data;
};
