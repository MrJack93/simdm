import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

// Teste pentru interceptorii din src/api/axios.js.
//
// ATENȚIE: setup.js mockează global modulul real `src/api/axios` (prin calea
// '../api/axios' relativă la setup). De aceea, aici îl DE-mockăm și încărcăm
// implementarea reală cu importActual, ca să rulăm codul interceptorilor.
// Pachetul de bază `axios` este mockat ca să capturăm handlerele înregistrate
// și să le apelăm direct, fără rețea reală.

vi.unmock('../../api/axios');
vi.unmock('../../api/axios.js');

// `vi.hoisted` asigură că aceste valori există ÎNAINTE ca importul modulului
// testat (ridicat de ESM) și factory-ul `vi.mock('axios')` să ruleze.
const { captured, fakeInstance, axiosPost } = vi.hoisted(() => {
  const captured = { request: null, responseSuccess: null, responseError: null };

  // Instanța falsă returnată de axios.create(): apelabilă (pentru retry) și cu
  // .interceptors care înregistrează handlerele în `captured`.
  const fakeInstance = vi.fn((config) => Promise.resolve({ data: { retried: true }, config }));
  fakeInstance.interceptors = {
    request: {
      use: (fn) => {
        captured.request = fn;
      },
    },
    response: {
      use: (onSuccess, onError) => {
        captured.responseSuccess = onSuccess;
        captured.responseError = onError;
      },
    },
  };

  const axiosPost = vi.fn(() => Promise.resolve({ data: { accessToken: 'refreshed-token' } }));
  return { captured, fakeInstance, axiosPost };
});

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => fakeInstance),
    post: axiosPost,
  },
}));

// Încarcă implementarea REALĂ a modulului (ocolind mock-ul global din setup.js).
// La evaluare, axios.js înregistrează interceptorii în `captured`.
beforeAll(async () => {
  await vi.importActual('../../api/axios.js');
});

// Importăm tokenStore pentru a gestiona starea tokenului în teste.
// Aceeași instanță de modul este folosită de axios.js, deci setToken/clearToken
// afectează direct comportamentul interceptorilor.
let tokenStore;
beforeAll(async () => {
  tokenStore = await vi.importActual('../../api/tokenStore.js');
});

beforeEach(() => {
  vi.clearAllMocks();
  tokenStore?.clearToken();
  fakeInstance.mockImplementation((config) => Promise.resolve({ data: { retried: true }, config }));
  axiosPost.mockImplementation(() => Promise.resolve({ data: { accessToken: 'refreshed-token' } }));
});

afterEach(() => {
  vi.restoreAllMocks();
  tokenStore?.clearToken();
});

describe('axios — interceptor de request (injectare Bearer)', () => {
  it('adaugă antetul Authorization când există un accessToken', () => {
    tokenStore.setToken('abc123');
    const config = { headers: {} };
    const result = captured.request(config);
    expect(result.headers.Authorization).toBe('Bearer abc123');
  });

  it('nu adaugă antetul Authorization când nu există token', () => {
    const config = { headers: {} };
    const result = captured.request(config);
    expect(result.headers.Authorization).toBeUndefined();
  });
});

describe('axios — interceptor de response', () => {
  it('lasă răspunsurile de succes neschimbate', () => {
    const response = { data: { ok: true }, status: 200 };
    expect(captured.responseSuccess(response)).toBe(response);
  });

  it('respinge erorile non-401 fără a încerca refresh', async () => {
    const error = { response: { status: 500 }, config: { headers: {} } };
    await expect(captured.responseError(error)).rejects.toBe(error);
    expect(axiosPost).not.toHaveBeenCalled();
  });

  it('respinge 401 care NU este TOKEN_EXPIRED fără a încerca refresh', async () => {
    const error = {
      response: { status: 401, data: { code: 'INVALID_CREDENTIALS' } },
      config: { headers: {} },
    };
    await expect(captured.responseError(error)).rejects.toBe(error);
    expect(axiosPost).not.toHaveBeenCalled();
  });

  it('la 401 TOKEN_EXPIRED face refresh, salvează noul token și reîncearcă request-ul', async () => {
    const error = {
      response: { status: 401, data: { code: 'TOKEN_EXPIRED' } },
      config: { headers: {}, url: '/devices' },
    };

    const retryResult = await captured.responseError(error);

    expect(axiosPost).toHaveBeenCalledWith(
      '/api/auth/refresh',
      {},
      expect.objectContaining({ withCredentials: true })
    );
    expect(tokenStore.getToken()).toBe('refreshed-token');
    expect(error.config.headers.Authorization).toBe('Bearer refreshed-token');
    expect(retryResult.data.retried).toBe(true);
  });

  it('când refresh-ul eșuează, șterge token-ul și redirecționează către "/"', async () => {
    tokenStore.setToken('expirat');
    axiosPost.mockRejectedValueOnce(new Error('refresh failed'));

    const hrefSetter = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { set href(v) { hrefSetter(v); }, get href() { return ''; } },
    });

    const error = {
      response: { status: 401, data: { code: 'TOKEN_EXPIRED' } },
      config: { headers: {}, url: '/devices' },
    };

    await expect(captured.responseError(error)).rejects.toThrow('refresh failed');
    expect(tokenStore.getToken()).toBeNull();
    expect(hrefSetter).toHaveBeenCalledWith('/');

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('nu reîncearcă de două ori același request (_retry deja setat)', async () => {
    const error = {
      response: { status: 401, data: { code: 'TOKEN_EXPIRED' } },
      config: { headers: {}, url: '/devices', _retry: true },
    };
    await expect(captured.responseError(error)).rejects.toBe(error);
    expect(axiosPost).not.toHaveBeenCalled();
  });
});
