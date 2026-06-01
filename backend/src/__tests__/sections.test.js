/**
 * Teste pentru modulul Secții — /api/sections
 *
 * Ruta este montată cu authMiddleware la nivel de aplicație
 * (app.use('/api/sections', authMiddleware, sectionsRoutes)), deci NU este
 * publică. Implementarea curentă expune doar GET / (listă secții active).
 *
 * NOTĂ: nu există un endpoint POST /api/sections în implementarea actuală
 * (Faza 1–2). Constrângerile de unicitate pentru `code` și prezența `floor`
 * sunt verificate la nivelul modelului Prisma (secția seed TEST).
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

describe('GET /api/sections', () => {
  it('necesită autentificare -> 401 NO_TOKEN fără token', async () => {
    const res = await request(app).get('/api/sections');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('NO_TOKEN');
  });

  it('returnează lista de secții active cu token valid', async () => {
    const res = await request(app)
      .get('/api/sections')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    const sec = res.body[0];
    expect(sec).toHaveProperty('id');
    expect(sec).toHaveProperty('name');
    expect(sec).toHaveProperty('code');
    expect(sec).toHaveProperty('floor');
  });

  it('include secția seed TEST cu floor "P"', async () => {
    const res = await request(app)
      .get('/api/sections')
      .set('Authorization', `Bearer ${token}`);
    const test = res.body.find((s) => s.code === 'TEST');
    expect(test).toBeDefined();
    expect(test.floor).toBe('P');
    expect(test.name).toBe('Secție Test');
  });
});

describe('Constrângeri model sections (unicitate code)', () => {
  it('respinge crearea unei secții cu cod duplicat (code @unique)', async () => {
    // TEST există deja din seed; un cod duplicat trebuie să arunce P2002
    await expect(
      prisma.sections.create({
        data: { name: 'Duplicat Cod TEST', code: 'TEST', floor: '1', updatedAt: new Date() },
      })
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('respinge crearea unei secții cu nume duplicat (name @unique)', async () => {
    await expect(
      prisma.sections.create({
        data: { name: 'Secție Test', code: 'TEST-DUP', floor: '2', updatedAt: new Date() },
      })
    ).rejects.toMatchObject({ code: 'P2002' });
  });
});
