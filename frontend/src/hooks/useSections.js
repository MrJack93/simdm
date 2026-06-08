/**
 * Custom React Query hooks pentru Sections.
 */
import { useQuery } from '@tanstack/react-query';
import { fetchSections, sectionKeys } from '../api/sections';

/**
 * Hook: Fetch all sections.
 * @param {Object} [options={}] - useQuery options
 * @returns {UseQueryResult}
 */
export const useSections = (options = {}) =>
  useQuery({
    queryKey: sectionKeys.all,
    queryFn: fetchSections,
    staleTime: 300_000, // 5 min
    ...options,
  });
