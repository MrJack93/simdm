import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../api/tokenStore', () => ({
  getToken: vi.fn(() => 'test-token'),
  setToken: vi.fn(),
  clearToken: vi.fn(),
}));

vi.mock('axios', () => {
  const interceptors = {
    request: { use: vi.fn(), eject: vi.fn() },
    response: { use: vi.fn(), eject: vi.fn() },
  };
  const instance = {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    interceptors,
  };
  return {
    default: {
      create: vi.fn(() => instance),
    },
  };
});

describe('axios.js — function coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('module can be imported', async () => {
    const mod = await import('../../api/axios');
    expect(mod.default).toBeDefined();
  });

  it('exports get/post/delete methods', async () => {
    const mod = await import('../../api/axios');
    expect(typeof mod.default.get).toBe('function');
    expect(typeof mod.default.post).toBe('function');
    expect(typeof mod.default.delete).toBe('function');
  });
});
