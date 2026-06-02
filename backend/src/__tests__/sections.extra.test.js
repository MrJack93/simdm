/**
 * Test suplimentar /api/sections — calea de eroare (catch -> 500).
 * Forțăm prisma.sections.findMany să arunce printr-un spy, pentru a acoperi
 * blocul catch din ruta GET /.
 */
const request = require('supertest');
const app = require('../index');
const prisma = require('../db');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

let token;

beforeAll(async () => {
  const loginRes = await request(app)
    .post('/api/auth/login?skip_ratelimit=true')
    .send({ username: 'testuser', password: TEST_PASSWORD });
  token = loginRes.body.accessToken;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/sections — cale de eroare', () => {
  it('returnează 500 când interogarea DB aruncă', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.sections, 'findMany').mockRejectedValueOnce(new Error('DB unavailable'));

    const res = await request(app)
      .get('/api/sections')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la preluarea secțiilor/i);
    errSpy.mockRestore();
  });
});
