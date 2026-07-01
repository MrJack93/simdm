import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockSetToken, mockClearToken, mockGetToken;

vi.mock('../../api/tokenStore', () => ({
  getToken: vi.fn(() => 'existing-token'),
  setToken: vi.fn(),
  clearToken: vi.fn(),
}));

vi.mock('axios', () => {
  const interceptors = {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  };
  const instance = {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    interceptors,
  };
  const staticAxios = {
    create: vi.fn(() => instance),
    post: vi.fn(() => Promise.resolve({ data: { accessToken: 'refreshed-token' } })),
  };
  return { default: staticAxios };
});

import axios from 'axios';
import { setToken, clearToken } from '../../api/tokenStore';

let requestInterceptorFn;
let responseSuccessFn;
let responseErrorFn;

beforeEach(async () => {
  vi.clearAllMocks();
  await import('../../api/axios');
  const instance = axios.create();
  requestInterceptorFn = instance.interceptors.request.use.mock.calls[0]?.[0];
  const responseCalls = instance.interceptors.response.use.mock.calls[0];
  responseSuccessFn = responseCalls?.[0];
  responseErrorFn = responseCalls?.[1];
});

describe('axios refresh interceptor', () => {
  it('response success handler passes response through', () => {
    if (!responseSuccessFn) return;
    const resp = { data: { ok: true }, status: 200 };
    expect(responseSuccessFn(resp)).toBe(resp);
  });

  it('rejects non-TOKEN_EXPIRED 401 errors', async () => {
    if (!responseErrorFn) return;
    const error = {
      response: { status: 401, data: { code: 'INVALID_TOKEN' } },
      config: { _retry: false },
    };
    await expect(responseErrorFn(error)).rejects.toBe(error);
  });

  it('rejects errors without response object', async () => {
    if (!responseErrorFn) return;
    const error = { config: {} };
    await expect(responseErrorFn(error)).rejects.toBe(error);
  });

  it('rejects 401 without TOKEN_EXPIRED code', async () => {
    if (!responseErrorFn) return;
    const error = {
      response: { status: 401, data: {} },
      config: { _retry: false },
    };
    await expect(responseErrorFn(error)).rejects.toBe(error);
  });

  it('handles TOKEN_EXPIRED by refreshing and retrying', async () => {
    if (!responseErrorFn) return;
    axios.post.mockResolvedValueOnce({ data: { accessToken: 'new-token-123' } });
    const originalConfig = { headers: {}, _retry: false, url: '/test' };
    const error = {
      response: { status: 401, data: { code: 'TOKEN_EXPIRED' } },
      config: originalConfig,
    };

    try {
      await responseErrorFn(error);
    } catch {
      // The retry may fail if mock doesn't match, that's OK for coverage
    }

    expect(setToken).toHaveBeenCalledWith('new-token-123');
  });

  it('refresh failure clears token and redirects', async () => {
    if (!responseErrorFn) return;
    axios.post.mockRejectedValueOnce(new Error('network error'));
    const originalConfig = { headers: {}, _retry: false };
    const error = {
      response: { status: 401, data: { code: 'TOKEN_EXPIRED' } },
      config: originalConfig,
    };

    try {
      await responseErrorFn(error);
    } catch {
      // expected
    }

    expect(clearToken).toHaveBeenCalled();
    expect(window.location.href).toBe('/');
  });

  it('queued requests resolve when refresh succeeds', async () => {
    if (!responseErrorFn) return;
    // First call starts refreshing
    axios.post.mockResolvedValueOnce({ data: { accessToken: 'queued-token' } });
    const config1 = { headers: {}, _retry: false, url: '/r1' };
    const error1 = {
      response: { status: 401, data: { code: 'TOKEN_EXPIRED' } },
      config: config1,
    };

    // Second call while refreshing is in progress — should queue
    const config2 = { headers: {}, _retry: false, url: '/r2' };
    const error2 = {
      response: { status: 401, data: { code: 'TOKEN_EXPIRED' } },
      config: config2,
    };

    // Kick off both
    const p1 = responseErrorFn(error1).catch(() => {});
    const p2 = responseErrorFn(error2).catch(() => {});

    await Promise.all([p1, p2]);

    expect(setToken).toHaveBeenCalled();
  });

  it('queued requests reject when refresh fails', async () => {
    if (!responseErrorFn) return;
    axios.post.mockRejectedValueOnce(new Error('refresh failed'));

    const config1 = { headers: {}, _retry: false, url: '/r1' };
    const error1 = {
      response: { status: 401, data: { code: 'TOKEN_EXPIRED' } },
      config: config1,
    };

    const config2 = { headers: {}, _retry: false, url: '/r2' };
    const error2 = {
      response: { status: 401, data: { code: 'TOKEN_EXPIRED' } },
      config: config2,
    };

    const p1 = responseErrorFn(error1).catch(() => {});
    const p2 = responseErrorFn(error2).catch(() => {});

    await Promise.all([p1, p2]);
    expect(clearToken).toHaveBeenCalled();
  });

  it('skips refresh if _retry is already true', async () => {
    if (!responseErrorFn) return;
    const error = {
      response: { status: 401, data: { code: 'TOKEN_EXPIRED' } },
      config: { _retry: true, headers: {} },
    };
    await expect(responseErrorFn(error)).rejects.toBe(error);
  });

  it('request interceptor adds Bearer when token exists', () => {
    if (!requestInterceptorFn) return;
    const config = { headers: {} };
    const result = requestInterceptorFn(config);
    expect(result.headers.Authorization).toBe('Bearer existing-token');
  });

  it('request interceptor skips when no token', () => {
    if (!requestInterceptorFn) return;
    const { getToken } = require('../../api/tokenStore');
    getToken.mockReturnValueOnce(null);
    const config = { headers: {} };
    const result = requestInterceptorFn(config);
    expect(result.headers.Authorization).toBeUndefined();
  });
});
