/**
 * Teste suplimentare pentru rutele de auth — căile de eroare rar atinse:
 *   GET  /api/auth/me     -> 404 când userul nu mai există în DB
 *   GET  /api/auth/me     -> 500 când interogarea DB aruncă
 *   POST /api/auth/logout -> 500 când AuthService.logout aruncă
 *
 * Folosim spy-uri pe prisma / AuthService pentru a forța erorile, fără a
 * atinge codul sursă.
 */
const request = require('supertest');
const app = require('../index');
const prisma = require('../db');
const AuthService = require('../services/authService');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

function login() {
  return request(app)
    .post('/api/auth/login?skip_ratelimit=true')
    .send({ username: 'testuser', password: TEST_PASSWORD });
}

async function getToken() {
  const res = await login();
  return res.body.accessToken;
}

describe('GET /api/auth/me — căi de eroare', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returnează 404 când utilizatorul din token nu mai există', async () => {
    const token = await getToken();
    vi.spyOn(prisma.users, 'findUnique').mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/nu găsit/i);
  });

  it('returnează 500 când interogarea DB aruncă', async () => {
    const token = await getToken();
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.users, 'findUnique').mockRejectedValueOnce(new Error('DB down'));

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare server/i);
    errSpy.mockRestore();
  });
});

describe('POST /api/auth/logout — cale de eroare', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returnează 500 când AuthService.logout aruncă', async () => {
    const loginRes = await login();
    const token = loginRes.body.accessToken;
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(AuthService, 'logout').mockRejectedValueOnce(new Error('logout failed'));

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/logout failed/i);
    errSpy.mockRestore();
  });
});
