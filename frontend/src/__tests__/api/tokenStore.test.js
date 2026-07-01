import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getToken, setToken, clearToken } from '../../api/tokenStore';

describe('tokenStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getToken', () => {
    it('returns token from sessionStorage', () => {
      sessionStorage.setItem('simdm_access_token', 'test-token-123');
      expect(getToken()).toBe('test-token-123');
    });

    it('returns null when no token stored', () => {
      sessionStorage.removeItem('simdm_access_token');
      expect(getToken()).toBeNull();
    });

    it('returns null when sessionStorage throws', () => {
      const original = sessionStorage.getItem;
      sessionStorage.getItem = vi.fn(() => { throw new Error('quota exceeded'); });
      expect(getToken()).toBeNull();
      sessionStorage.getItem = original;
    });
  });

  describe('setToken', () => {
    it('stores token in sessionStorage', () => {
      setToken('my-jwt-token');
      expect(sessionStorage.getItem('simdm_access_token')).toBe('my-jwt-token');
    });

    it('overwrites existing token', () => {
      setToken('token-1');
      setToken('token-2');
      expect(sessionStorage.getItem('simdm_access_token')).toBe('token-2');
    });

    it('does not throw when sessionStorage is unavailable', () => {
      const original = sessionStorage.setItem;
      sessionStorage.setItem = vi.fn(() => { throw new Error('quota exceeded'); });
      expect(() => setToken('test')).not.toThrow();
      sessionStorage.setItem = original;
    });
  });

  describe('clearToken', () => {
    it('removes token from sessionStorage', () => {
      sessionStorage.setItem('simdm_access_token', 'to-be-cleared');
      clearToken();
      expect(sessionStorage.getItem('simdm_access_token')).toBeNull();
    });

    it('does not throw when token does not exist', () => {
      sessionStorage.removeItem('simdm_access_token');
      expect(() => clearToken()).not.toThrow();
    });

    it('does not throw when sessionStorage throws', () => {
      const original = sessionStorage.removeItem;
      sessionStorage.removeItem = vi.fn(() => { throw new Error('quota exceeded'); });
      expect(() => clearToken()).not.toThrow();
      sessionStorage.removeItem = original;
    });
  });

  describe('full lifecycle', () => {
    it('set → get → clear → get returns null', () => {
      setToken('lifecycle-token');
      expect(getToken()).toBe('lifecycle-token');
      clearToken();
      expect(getToken()).toBeNull();
    });
  });
});
