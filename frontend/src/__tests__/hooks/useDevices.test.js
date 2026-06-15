import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import api from '../../api/axios';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import {
  useDevices,
  useDevice,
  useCreateDevice,
  useUpdateDevice,
  useDeleteDevice,
  useAnnualInventory,
  useConsumables,
} from '../../hooks/useDevices';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return function Wrapper({ children }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useDevices hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useDevices', () => {
    it('fetches devices list', async () => {
      api.get.mockResolvedValueOnce({
        data: { devices: [{ id: 1, name: 'Test' }] },
      });
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDevices(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data.devices).toHaveLength(1);
    });

    it('passes filters to API call', async () => {
      api.get.mockResolvedValueOnce({ data: { devices: [] } });
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDevices({ status: 'FUNCTIONAL' }), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('status=FUNCTIONAL')
      );
    });

    it('can be disabled', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDevices({}, { enabled: false }), { wrapper });

      expect(result.current.isFetching).toBe(false);
      expect(api.get).not.toHaveBeenCalled();
    });
  });

  describe('useDevice', () => {
    it('fetches single device', async () => {
      api.get.mockResolvedValueOnce({ data: { id: 42, name: 'Device 42' } });
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDevice(42), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data.name).toBe('Device 42');
    });

    it('is disabled when id is falsy', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDevice(null), { wrapper });

      expect(result.current.isFetching).toBe(false);
      expect(api.get).not.toHaveBeenCalled();
    });

    it('is disabled when id is 0', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDevice(0), { wrapper });

      expect(result.current.isFetching).toBe(false);
    });
  });

  describe('useCreateDevice', () => {
    it('calls POST /devices on mutate', async () => {
      api.post.mockResolvedValueOnce({ data: { id: 1 } });
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateDevice(), { wrapper });

      result.current.mutate({ name: 'New Device' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(api.post).toHaveBeenCalledWith('/devices', { name: 'New Device' });
    });
  });

  describe('useUpdateDevice', () => {
    it('calls PATCH /devices/:id on mutate', async () => {
      api.patch.mockResolvedValueOnce({ data: { id: 5 } });
      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateDevice(), { wrapper });

      result.current.mutate({ id: 5, payload: { name: 'Updated' } });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(api.patch).toHaveBeenCalledWith('/devices/5', { name: 'Updated' });
    });
  });

  describe('useDeleteDevice', () => {
    it('calls DELETE /devices/:id on mutate', async () => {
      api.delete.mockResolvedValueOnce({ data: {} });
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDeleteDevice(), { wrapper });

      result.current.mutate(10);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(api.delete).toHaveBeenCalledWith('/devices/10');
    });
  });

  describe('useAnnualInventory', () => {
    it('fetches annual inventory', async () => {
      api.get.mockResolvedValueOnce({ data: { items: [] } });
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAnnualInventory(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(api.get).toHaveBeenCalledWith('/devices/inventory/annual');
    });
  });

  describe('useConsumables', () => {
    it('fetches consumables list', async () => {
      api.get.mockResolvedValueOnce({ data: [{ id: 1, name: 'Filtru' }] });
      const wrapper = createWrapper();
      const { result } = renderHook(() => useConsumables(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toHaveLength(1);
    });
  });
});
