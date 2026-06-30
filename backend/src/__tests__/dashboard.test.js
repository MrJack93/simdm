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

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/dashboard/summary', () => {
  it('returnează toate secțiunile KPI', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.devices).toBeDefined();
    expect(res.body.devices.total).toBeGreaterThanOrEqual(0);
    expect(res.body.devices.byStatus).toBeDefined();
    expect(res.body.maintenance).toBeDefined();
    expect(res.body.verifications).toBeDefined();
    expect(res.body.incidents).toBeDefined();
    expect(res.body.tickets).toBeDefined();
    expect(res.body.documents).toBeDefined();
    expect(res.body.contracts).toBeDefined();
    expect(res.body.consumables).toBeDefined();
  });

  it('DM pe status conține toate cheile', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.devices.byStatus).toHaveProperty('FUNCTIONAL');
    expect(res.body.devices.byStatus).toHaveProperty('IN_REPARATIE');
    expect(res.body.devices.byStatus).toHaveProperty('DEFECT');
    expect(res.body.devices.byStatus).toHaveProperty('CONSERVAT');
  });

  it('fără token -> 401', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/dashboard/cost-summary', () => {
  it('returnează cost intern vs extern', async () => {
    const res = await request(app)
      .get('/api/dashboard/cost-summary?year=2026')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.internal).toBeDefined();
    expect(res.body.external).toBeDefined();
    expect(typeof res.body.internal.totalCost).toBe('number');
    expect(typeof res.body.external.totalCost).toBe('number');
  });

  it('fără token -> 401', async () => {
    const res = await request(app).get('/api/dashboard/cost-summary');
    expect(res.status).toBe(401);
  });

  it('an invalid -> fall back la anul curent (200)', async () => {
    const res = await request(app)
      .get('/api/dashboard/cost-summary?year=abc')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.year).toBe(new Date().getFullYear());
  });
});
