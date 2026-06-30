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

describe('GET /api/activity-report — raport agregat', () => {
  it('returnează structura completă', async () => {
    const res = await request(app)
      .get('/api/activity-report?from=2026-01-01&to=2026-12-31')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.period).toBeDefined();
    expect(res.body.activityAnalysis).toBeDefined();
    expect(res.body.faultBreakdown).toBeDefined();
    expect(res.body.timeIntervals).toBeDefined();
    expect(typeof res.body.newDevicesInstalled).toBe('number');
  });

  it('parametri invalizi → 400', async () => {
    const res = await request(app)
      .get('/api/activity-report?from=invalid&to=also-invalid')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('fără parametri → 400', async () => {
    const res = await request(app)
      .get('/api/activity-report')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/activity-report/formular12-pdf', () => {
  it('returnează PDF 200', async () => {
    const res = await request(app)
      .get('/api/activity-report/formular12-pdf?from=2026-01-01&to=2026-12-31')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });

  it('parametri invalizi → 400', async () => {
    const res = await request(app)
      .get('/api/activity-report/formular12-pdf?from=bad&to=bad')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
