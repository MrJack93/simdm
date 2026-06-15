import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { consumables: [] } })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import { consumableKeys, fetchConsumables, fetchConsumablesWithFilters, fetchConsumableStats, deleteConsumable, getConsumables, updateConsumableStock } from '../../api/consumables';
import api from '../../api/axios';

describe('consumables API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('consumableKeys', () => {
    it('has correct base key', () => {
      expect(consumableKeys.all).toEqual(['consumables']);
    });

    it('generates list key with filters', () => {
      expect(consumableKeys.list({ search: 'test' })).toEqual(['consumables', 'list', { search: 'test' }]);
    });

    it('has stats key', () => {
      expect(consumableKeys.stats).toEqual(['consumables', 'stats']);
    });
  });

  describe('fetchConsumables', () => {
    it('returns consumables data', async () => {
      api.get.mockResolvedValueOnce({ data: { consumables: [{ id: 1, name: 'Filtru' }] } });
      const result = await fetchConsumables();
      expect(api.get).toHaveBeenCalledWith('/consumables');
      expect(result).toEqual({ consumables: [{ id: 1, name: 'Filtru' }] });
    });
  });

  describe('fetchConsumablesWithFilters', () => {
    it('sends search parameter', async () => {
      api.get.mockResolvedValueOnce({ data: { consumables: [] } });
      await fetchConsumablesWithFilters('test');
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('search=test'));
    });

    it('sends pagination parameters', async () => {
      api.get.mockResolvedValueOnce({ data: { consumables: [] } });
      await fetchConsumablesWithFilters('', {}, 2, 10);
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('page=2'));
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('limit=10'));
    });

    it('sends filter parameters', async () => {
      api.get.mockResolvedValueOnce({ data: { consumables: [] } });
      await fetchConsumablesWithFilters('', { category: 'filtru' });
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('category=filtru'));
    });

    it('skips empty filter values', async () => {
      api.get.mockResolvedValueOnce({ data: { consumables: [] } });
      await fetchConsumablesWithFilters('', { empty: '', nullVal: null, undefVal: undefined });
      const url = api.get.mock.calls[0][0];
      expect(url).not.toContain('empty=');
      expect(url).not.toContain('nullVal=');
      expect(url).not.toContain('undefVal=');
    });

    it('uses default parameters', async () => {
      api.get.mockResolvedValueOnce({ data: { consumables: [] } });
      await fetchConsumablesWithFilters();
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('page=1'));
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('limit=20'));
    });
  });

  describe('fetchConsumableStats', () => {
    it('calculates low stock count', async () => {
      api.get.mockResolvedValueOnce({
        data: {
          consumables: [
            { id: 1, name: 'A', currentQuantity: 2, minimumQuantity: 5 },
            { id: 2, name: 'B', currentQuantity: 10, minimumQuantity: 5 },
            { id: 3, name: 'C', currentQuantity: 3, minimumQuantity: 3 },
          ],
        },
      });
      const stats = await fetchConsumableStats();
      expect(stats.lowStock).toBe(2);
    });

    it('returns 0 when no low stock', async () => {
      api.get.mockResolvedValueOnce({
        data: {
          consumables: [
            { id: 1, name: 'A', currentQuantity: 10, minimumQuantity: 5 },
          ],
        },
      });
      const stats = await fetchConsumableStats();
      expect(stats.lowStock).toBe(0);
    });

    it('handles empty consumables list', async () => {
      api.get.mockResolvedValueOnce({ data: { consumables: [] } });
      const stats = await fetchConsumableStats();
      expect(stats.lowStock).toBe(0);
    });

    it('handles missing consumables key', async () => {
      api.get.mockResolvedValueOnce({ data: {} });
      const stats = await fetchConsumableStats();
      expect(stats.lowStock).toBe(0);
    });
  });

  describe('deleteConsumable', () => {
    it('calls delete endpoint with id', async () => {
      await deleteConsumable(42);
      expect(api.delete).toHaveBeenCalledWith('/consumables/42');
    });
  });

  describe('getConsumables', () => {
    it('is an alias for fetchConsumables', async () => {
      api.get.mockResolvedValueOnce({ data: { consumables: [] } });
      await getConsumables();
      expect(api.get).toHaveBeenCalledWith('/consumables');
    });
  });

  describe('updateConsumableStock', () => {
    it('calls patch with delta', async () => {
      api.patch.mockResolvedValueOnce({ data: { quantity: 15 } });
      const result = await updateConsumableStock(5, 10);
      expect(api.patch).toHaveBeenCalledWith('/consumables/5/stock', { delta: 10 });
      expect(result).toEqual({ quantity: 15 });
    });

    it('handles negative delta', async () => {
      api.patch.mockResolvedValueOnce({ data: { quantity: 5 } });
      await updateConsumableStock(5, -5);
      expect(api.patch).toHaveBeenCalledWith('/consumables/5/stock', { delta: -5 });
    });
  });
});
