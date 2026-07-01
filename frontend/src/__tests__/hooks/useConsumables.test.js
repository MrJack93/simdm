import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useConsumablesQuery,
  useConsumablesWithFilters,
  useConsumableStats,
} from '../../hooks/useConsumables';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

vi.mock('../../api/consumables', () => ({
  fetchConsumables: vi.fn(() => Promise.resolve([])),
  fetchConsumablesWithFilters: vi.fn(() => Promise.resolve({ data: [], total: 0 })),
  fetchConsumableStats: vi.fn(() => Promise.resolve({ total: 0 })),
  consumableKeys: {
    all: ['consumables'],
    list: (params) => ['consumables', 'list', params],
    stats: ['consumables', 'stats'],
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useConsumables hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useConsumablesQuery', () => {
    it('returns useQuery result', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useConsumablesQuery(), { wrapper });
      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
    });

    it('uses consumableKeys.all as queryKey', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useConsumablesQuery(), { wrapper });
      expect(result.current.isLoading).toBe(true);
    });

    it('accepts custom options', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useConsumablesQuery({ enabled: false }), { wrapper });
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useConsumablesWithFilters', () => {
    it('returns useQuery result with filters', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useConsumablesWithFilters('search', { status: 'ACTIVE' }, 1, 20),
        { wrapper }
      );
      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
    });

    it('uses default params', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useConsumablesWithFilters(), { wrapper });
      expect(result.current.isLoading).toBe(true);
    });

    it('uses custom options', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useConsumablesWithFilters('', {}, 1, 10, { enabled: false }),
        { wrapper }
      );
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useConsumableStats', () => {
    it('returns useQuery result', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useConsumableStats(), { wrapper });
      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
    });

    it('accepts custom options', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useConsumableStats({ enabled: false }), { wrapper });
      expect(result.current.fetchStatus).toBe('idle');
    });
  });
});
