import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useDocuments, useDocument, useDocumentCategories } from '../../hooks/useDocuments';

vi.mock('../../api/documents', () => ({
  fetchDocuments: vi.fn(() => Promise.resolve({ data: [], total: 0 })),
  fetchDocument: vi.fn(() => Promise.resolve({ data: {} })),
  fetchDocumentCategories: vi.fn(() => Promise.resolve([])),
  documentKeys: {
    all: ['documents'],
    list: (params) => ['documents', 'list', params],
    detail: (id) => ['documents', 'detail', id],
    categories: ['documents', 'categories'],
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useDocuments hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useDocuments', () => {
    it('returns useQuery result with default params', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDocuments(), { wrapper });
      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
    });

    it('accepts custom search and filters', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDocuments('test', { status: 'ACTIVE' }, 1, 10), { wrapper });
      expect(result.current.isLoading).toBe(true);
    });

    it('accepts custom options', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDocuments('', {}, 1, 50, { enabled: false }), { wrapper });
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useDocument', () => {
    it('does not fetch when id is null', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDocument(null), { wrapper });
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('fetches when id is provided', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDocument(1), { wrapper });
      expect(result.current).toHaveProperty('data');
    });

    it('accepts custom options', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDocument(1, { enabled: false }), { wrapper });
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useDocumentCategories', () => {
    it('returns useQuery result', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDocumentCategories(), { wrapper });
      expect(result.current).toHaveProperty('data');
    });

    it('accepts custom options', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDocumentCategories({ enabled: false }), { wrapper });
      expect(result.current.fetchStatus).toBe('idle');
    });
  });
});
