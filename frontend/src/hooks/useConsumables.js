/**
 * Custom React Query hooks pentru Consumables.
 */
import { useQuery } from '@tanstack/react-query';
import {
  fetchConsumables,
  fetchConsumablesWithFilters,
  fetchConsumableStats,
  consumableKeys,
} from '../api/consumables';

/**
 * Hook: Fetch all consumables.
 * @param {Object} [options={}] - useQuery options
 * @returns {UseQueryResult}
 */
export const useConsumablesQuery = (options = {}) =>
  useQuery({
    queryKey: consumableKeys.all,
    queryFn: fetchConsumables,
    staleTime: 120_000,
    ...options,
  });

/**
 * Hook: Fetch consumables with filters and pagination.
 * @param {string} search
 * @param {Object} filters
 * @param {number} page
 * @param {number} limit
 * @param {Object} [options={}] - useQuery options
 * @returns {UseQueryResult}
 */
export const useConsumablesWithFilters = (search = '', filters = {}, page = 1, limit = 20, options = {}) =>
  useQuery({
    queryKey: consumableKeys.list({ search, filters, page, limit }),
    queryFn: () => fetchConsumablesWithFilters(search, filters, page, limit),
    staleTime: 60_000,
    keepPreviousData: true,
    ...options,
  });

/**
 * Hook: Fetch consumable statistics.
 * @param {Object} [options={}] - useQuery options
 * @returns {UseQueryResult}
 */
export const useConsumableStats = (options = {}) =>
  useQuery({
    queryKey: consumableKeys.stats,
    queryFn: fetchConsumableStats,
    staleTime: 120_000,
    ...options,
  });
