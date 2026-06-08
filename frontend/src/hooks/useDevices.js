/**
 * Custom React Query hooks pentru Devices.
 * Decuplează data-fetching logic din componente.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDevices,
  fetchDevice,
  createDevice,
  updateDevice,
  deleteDevice,
  fetchAnnualInventory,
  fetchConsumables,
  deviceKeys,
} from '../api/devices';

/**
 * Hook: Fetch all devices cu filters.
 * @param {Object} [filters={}]
 * @param {Object} [options={}] - useQuery options (enabled, staleTime, etc.)
 * @returns {UseQueryResult}
 */
export const useDevices = (filters = {}, options = {}) =>
  useQuery({
    queryKey: deviceKeys.list(filters),
    queryFn: () => fetchDevices(filters),
    staleTime: 120_000, // 2 min
    ...options,
  });

/**
 * Hook: Fetch single device.
 * @param {number} id
 * @param {Object} [options={}]
 * @returns {UseQueryResult}
 */
export const useDevice = (id, options = {}) =>
  useQuery({
    queryKey: deviceKeys.detail(id),
    queryFn: () => fetchDevice(id),
    enabled: !!id,
    staleTime: 120_000,
    ...options,
  });

/**
 * Hook: Create device mutation.
 * @returns {UseMutationResult}
 */
export const useCreateDevice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createDevice,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: deviceKeys.all });
    },
  });
};

/**
 * Hook: Update device mutation.
 * @returns {UseMutationResult}
 */
export const useUpdateDevice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateDevice(id, payload),
    onSuccess: (data) => {
      // Invalidate list + detail for this device
      qc.invalidateQueries({ queryKey: deviceKeys.all });
      qc.invalidateQueries({ queryKey: deviceKeys.detail(data.id) });
    },
  });
};

/**
 * Hook: Delete device mutation.
 * @returns {UseMutationResult}
 */
export const useDeleteDevice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDevice,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: deviceKeys.all });
    },
  });
};

/**
 * Hook: Fetch annual inventory.
 * @param {Object} [options={}]
 * @returns {UseQueryResult}
 */
export const useAnnualInventory = (options = {}) =>
  useQuery({
    queryKey: deviceKeys.inventory,
    queryFn: fetchAnnualInventory,
    staleTime: 300_000, // 5 min
    ...options,
  });

/**
 * Hook: Fetch consumables.
 * @param {Object} [options={}]
 * @returns {UseQueryResult}
 */
export const useConsumables = (options = {}) =>
  useQuery({
    queryKey: deviceKeys.consumables,
    queryFn: fetchConsumables,
    staleTime: 120_000,
    ...options,
  });
