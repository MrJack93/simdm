import { describe, it, expect, vi, afterEach } from 'vitest';
import { getToken, setToken, clearToken } from '../../api/tokenStore';

describe('tokenStore — branch coverage', () => {
  const origGetItem = Storage.prototype.getItem;
  const origSetItem = Storage.prototype.setItem;
  const origRemoveItem = Storage.prototype.removeItem;

  afterEach(() => {
    Storage.prototype.getItem = origGetItem;
    Storage.prototype.setItem = origSetItem;
    Storage.prototype.removeItem = origRemoveItem;
    sessionStorage.clear();
  });

  describe('getToken — catch branch', () => {
    it('returns null when getItem throws', () => {
      Storage.prototype.getItem = vi.fn(() => { throw new Error('SecurityError'); });
      expect(getToken()).toBeNull();
    });

    it('returns value in happy path', () => {
      sessionStorage.setItem('simdm_access_token', 'abc');
      expect(getToken()).toBe('abc');
    });

    it('returns null when key is absent', () => {
      expect(getToken()).toBeNull();
    });
  });

  describe('setToken — catch branch', () => {
    it('silently ignores when setItem throws', () => {
      Storage.prototype.setItem = vi.fn(() => { throw new Error('QuotaExceeded'); });
      expect(() => setToken('x')).not.toThrow();
    });

    it('stores token in happy path', () => {
      setToken('hello');
      expect(sessionStorage.getItem('simdm_access_token')).toBe('hello');
    });
  });

  describe('clearToken — catch branch', () => {
    it('silently ignores when removeItem throws', () => {
      Storage.prototype.removeItem = vi.fn(() => { throw new Error('SecurityError'); });
      expect(() => clearToken()).not.toThrow();
    });

    it('removes token in happy path', () => {
      sessionStorage.setItem('simdm_access_token', 'to-clear');
      clearToken();
      expect(sessionStorage.getItem('simdm_access_token')).toBeNull();
    });
  });
});
