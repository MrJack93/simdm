const request = require('supertest');
const app = require('../index');
const prisma = require('../db');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

let token;
const createdIds = [];

beforeAll(async () => {
  const loginRes = await request(app)
    .post('/api/auth/login?skip_ratelimit=true')
    .send({ username: 'testuser', password: TEST_PASSWORD });
  token = loginRes.body.accessToken;
});

afterEach(async () => {
  if (createdIds.length) {
    const ids = createdIds.splice(0);
    await prisma.duty_log_entries.deleteMany({ where: { id: { in: ids } } });
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/duty-log — raportare defecțiune', () => {
  it('creează intrare + audit ne-null', async () => {
    const res = await request(app)
      .post('/api/duty-log')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceName: 'Ventilator Test',
        faultDescription: 'Nu pornește',
        reportedBy: 'Asistent gardă',
      });
    expect(res.status).toBe(201);
    expect(res.body.faultDescription).toBe('Nu pornește');
    expect(res.body.resolvedAt).toBeNull();
    createdIds.push(res.body.id);

    const audit = await prisma.audit_logs.findFirst({
      where: { entity: 'DutyLogEntry', entityId: String(res.body.id), action: 'CREATE' },
      orderBy: { timestamp: 'desc' },
    });
    expect(audit).toBeTruthy();
    expect(audit.userId).toBeTruthy();
  });

  it('date invalide → 400', async () => {
    const res = await request(app)
      .post('/api/duty-log')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceName: '', faultDescription: '', reportedBy: '' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/duty-log/:id/resolve — soluționare', () => {
  it('setează resolvedAt + engineerName', async () => {
    const createRes = await request(app)
      .post('/api/duty-log')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceName: 'ECG Test', faultDescription: 'Eroare semnal', reportedBy: 'Nurse' });
    const entryId = createRes.body.id;
    createdIds.push(entryId);

    const res = await request(app)
      .patch(`/api/duty-log/${entryId}/resolve`)
      .set('Authorization', `Bearer ${token}`)
      .send({ resolution: 'Cablu înlocuit', engineerName: 'Ing. Popescu' });
    expect(res.status).toBe(200);
    expect(res.body.resolvedAt).toBeTruthy();
    expect(res.body.engineerName).toBe('Ing. Popescu');
  });

  it('deja soluționat → 409', async () => {
    const createRes = await request(app)
      .post('/api/duty-log')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceName: 'Already Resolved', faultDescription: 'Test', reportedBy: 'X' });
    const entryId = createRes.body.id;
    createdIds.push(entryId);

    await request(app)
      .patch(`/api/duty-log/${entryId}/resolve`)
      .set('Authorization', `Bearer ${token}`)
      .send({ resolution: 'Done', engineerName: 'Ing.' });

    const res = await request(app)
      .patch(`/api/duty-log/${entryId}/resolve`)
      .set('Authorization', `Bearer ${token}`)
      .send({ resolution: 'Again', engineerName: 'Ing.2' });
    expect(res.status).toBe(409);
  });

  it('id invalid → 400', async () => {
    const res = await request(app)
      .patch('/api/duty-log/abc/resolve')
      .set('Authorization', `Bearer ${token}`)
      .send({ resolution: 'X', engineerName: 'Y' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/duty-log — listă', () => {
  it('returnează structura paginată', async () => {
    const res = await request(app)
      .get('/api/duty-log')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  it('filtrează resolved=false', async () => {
    const res = await request(app)
      .get('/api/duty-log?resolved=false')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((e) => expect(e.resolvedAt).toBeNull());
  });
});

describe('GET /api/duty-log/formular11-pdf', () => {
  it('returnează PDF 200', async () => {
    const res = await request(app)
      .get('/api/duty-log/formular11-pdf')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });
});
