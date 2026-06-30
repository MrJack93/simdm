const request = require('supertest');
const app = require('../index');
const prisma = require('../db');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';
let token;
let testDeviceId;

beforeAll(async () => {
  const loginRes = await request(app)
    .post('/api/auth/login?skip_ratelimit=true')
    .send({ username: 'testuser', password: TEST_PASSWORD });
  token = loginRes.body.accessToken;

  const deviceRes = await request(app)
    .post('/api/devices')
    .set('Authorization', `Bearer ${token}`)
    .send({ inventoryNumber: `COMM-${Date.now()}`, name: 'Test Commission Device', riskClass: 'IIa', sectionId: 1 });
  testDeviceId = deviceRes.body.id;
});

afterAll(async () => {
  if (testDeviceId) {
    await prisma.commissioning_records.deleteMany({ where: { deviceId: testDeviceId } }).catch(() => {});
    await prisma.devices.delete({ where: { id: testDeviceId } }).catch(() => {});
  }
  await prisma.$disconnect();
});

describe('POST /api/commissioning', () => {
  it('dare în exploatare -> device FUNCTIONAL + audit ne-null', async () => {
    const res = await request(app)
      .post('/api/commissioning')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        installDate: new Date().toISOString(),
        warrantyMonths: 12,
        conformityOk: true,
        operationTestOk: true,
        commissionMembers: 'Ing. A, Ing. B',
        commissionDecision: 'Aprobat',
      });
    expect(res.status).toBe(201);
    expect(res.body.conformityOk).toBe(true);

    const device = await prisma.devices.findUnique({ where: { id: testDeviceId } });
    expect(device.status).toBe('FUNCTIONAL');
    expect(device.acquisitionDate).toBeTruthy();
    expect(device.warrantyEndDate).toBeTruthy();

    const audit = await prisma.audit_logs.findFirst({
      where: { entity: 'CommissioningRecord', entityId: String(res.body.id), action: 'CREATE' },
      orderBy: { timestamp: 'desc' },
    });
    expect(audit).toBeTruthy();
    expect(audit.userId).toBeTruthy();
  });

  it('device inexistent -> 404', async () => {
    const res = await request(app)
      .post('/api/commissioning')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceId: 99999, conformityOk: true });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/commissioning', () => {
  it('returnează structura paginată', async () => {
    const res = await request(app).get('/api/commissioning').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/commissioning/:id/formular4-pdf', () => {
  it('returnează PDF 200', async () => {
    const commRes = await request(app)
      .post('/api/commissioning')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceId: testDeviceId, conformityOk: true });
    const commId = commRes.body.id;

    const res = await request(app).get(`/api/commissioning/${commId}/formular4-pdf`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });

  it('document inexistent -> 404', async () => {
    const res = await request(app).get('/api/commissioning/99999/formular4-pdf').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('id invalid -> 400', async () => {
    const res = await request(app).get('/api/commissioning/abc/formular4-pdf').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/commissioning/:id/formular3-pdf', () => {
  it('cu handoverActNo -> returnează PDF 200', async () => {
    const commRes = await request(app)
      .post('/api/commissioning')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceId: testDeviceId, handoverActNo: 'ACT-001', supplier: 'Furnizor Test', conformityOk: true });
    const commId = commRes.body.id;

    const res = await request(app).get(`/api/commissioning/${commId}/formular3-pdf`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });

  it('document inexistent -> 404', async () => {
    const res = await request(app).get('/api/commissioning/99999/formular3-pdf').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('id invalid -> 400', async () => {
    const res = await request(app).get('/api/commissioning/abc/formular3-pdf').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/commissioning/:id', () => {
  it('returnează detalii cu device', async () => {
    const commRes = await request(app)
      .post('/api/commissioning')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceId: testDeviceId, conformityOk: true });

    const res = await request(app).get(`/api/commissioning/${commRes.body.id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.device).toBeTruthy();
  });
});
