const request = require('supertest');
const app = require('../index');
const prisma = require('../db');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

let token;
let testDeviceId;
const createdIds = [];

beforeAll(async () => {
  const loginRes = await request(app)
    .post('/api/auth/login?skip_ratelimit=true')
    .send({ username: 'testuser', password: TEST_PASSWORD });
  token = loginRes.body.accessToken;

  const deviceRes = await request(app)
    .post('/api/devices')
    .set('Authorization', `Bearer ${token}`)
    .send({
      inventoryNumber: `DECOM-${Date.now()}`,
      name: 'Test Decommission Device',
      riskClass: 'IIa',
      sectionId: 1,
    });
  testDeviceId = deviceRes.body.id;
});

afterEach(async () => {
  if (createdIds.length) {
    const ids = createdIds.splice(0);
    await prisma.decommission_records.deleteMany({ where: { id: { in: ids } } });
  }
});

afterAll(async () => {
  if (testDeviceId) {
    await prisma.devices.update({ where: { id: testDeviceId }, data: { status: 'FUNCTIONAL', decommissionDate: null } }).catch(() => {});
  }
  await prisma.$disconnect();
});

describe('POST /api/decommission — creare casare', () => {
  it('CASARE → device CASAT + audit ne-null', async () => {
    const res = await request(app)
      .post('/api/decommission')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        type: 'CASARE',
        cause: 'Defect ireparabil',
        technicalState: 'Componente deteriorate',
      });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('CASARE');
    expect(res.body.device).toBeTruthy();
    createdIds.push(res.body.id);

    const device = await prisma.devices.findUnique({ where: { id: testDeviceId } });
    expect(device.status).toBe('CASAT');
    expect(device.decommissionDate).toBeTruthy();

    const audit = await prisma.audit_logs.findFirst({
      where: { entity: 'DecommissionRecord', entityId: String(res.body.id), action: 'CREATE' },
      orderBy: { timestamp: 'desc' },
    });
    expect(audit).toBeTruthy();
    expect(audit.userId).toBeTruthy();
  });

  it('CONSERVARE → device CONSERVAT', async () => {
    const res = await request(app)
      .post('/api/decommission')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceId: testDeviceId, type: 'CONSERVARE', cause: ' lipsă piese' });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('CONSERVARE');
    createdIds.push(res.body.id);

    const device = await prisma.devices.findUnique({ where: { id: testDeviceId } });
    expect(device.status).toBe('CONSERVAT');
  });

  it('device inexistent → 404', async () => {
    const res = await request(app)
      .post('/api/decommission')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceId: 99999, type: 'CASARE' });
    expect(res.status).toBe(404);
  });

  it('tip invalid → 400', async () => {
    const res = await request(app)
      .post('/api/decommission')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceId: testDeviceId, type: 'INVALID' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/decommission — listă', () => {
  it('returnează structura paginată', async () => {
    const res = await request(app)
      .get('/api/decommission')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });
});

describe('GET /api/decommission/:id — detalii', () => {
  it('returnează înregistrare cu device', async () => {
    const createRes = await request(app)
      .post('/api/decommission')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceId: testDeviceId, type: 'DEFECTARE', cause: 'Test' });
    createdIds.push(createRes.body.id);

    const res = await request(app)
      .get(`/api/decommission/${createRes.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.device).toBeTruthy();
  });

  it('id invalid → 400', async () => {
    const res = await request(app)
      .get('/api/decommission/abc')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('inexistent → 404', async () => {
    const res = await request(app)
      .get('/api/decommission/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/decommission/:id/formular10-pdf', () => {
  it('returnează PDF 200', async () => {
    const createRes = await request(app)
      .post('/api/decommission')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceId: testDeviceId, type: 'CASARE', cause: 'PDF test' });
    createdIds.push(createRes.body.id);

    const res = await request(app)
      .get(`/api/decommission/${createRes.body.id}/formular10-pdf`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });
});
