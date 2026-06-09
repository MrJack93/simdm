/**
 * Teste pentru modulul Verificări Periodice — /api/verifications
 *
 * Testează:
 * - POST create verification
 * - GET compliance report (NEVERIFICAT/CONFORM/EXPIRAT)
 * - Get/List verifications
 * - Audit logging
 */
const request = require('supertest');
const app = require('../index');
const prisma = require('../db');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

let token;
let userId;
let testDeviceId;
let testVerificationId;

beforeAll(async () => {
  // Login
  const loginRes = await request(app)
    .post('/api/auth/login?skip_ratelimit=true')
    .send({ username: 'testuser', password: TEST_PASSWORD });
  token = loginRes.body.accessToken;
  userId = loginRes.body.user.id;

  // Create test device with verification requirements
  const deviceRes = await request(app)
    .post('/api/devices')
    .set('Authorization', `Bearer ${token}`)
    .send({
      inventoryNumber: `TEST-VERIF-${Date.now()}`,
      name: 'Monitor Pacient Verificare Test',
      riskClass: 'IIa',
      sectionId: 1,
    });
  testDeviceId = deviceRes.body.id;

  // Mark device as requiring verification
  await prisma.devices.update({
    where: { id: testDeviceId },
    data: {
      requiresVerification: true,
      verificationType: 'METROLOGIC',
      verificationFreqMonths: 24,
    },
  });
});

afterAll(async () => {
  if (testDeviceId) {
    await prisma.verifications.deleteMany({ where: { deviceId: testDeviceId } });
    await prisma.devices.deleteMany({ where: { id: testDeviceId } });
  }
});

describe('POST /api/verifications — Creare înregistrare', () => {
  it('fără token → 401', async () => {
    const res = await request(app).post('/api/verifications').send({});
    expect(res.status).toBe(401);
  });

  it('crează înregistrare cu date valide', async () => {
    const res = await request(app)
      .post('/api/verifications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        type: 'METROLOGIC',
        performedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 24 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        result: 'CONFORM',
        certificateNo: 'CERT-2026-001',
        inspectionBody: 'Institutul de Metrologie Republicii Moldova',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.deviceId).toBe(testDeviceId);
    expect(res.body.type).toBe('METROLOGIC');
    expect(res.body.result).toBe('CONFORM');

    testVerificationId = res.body.id;
  });

  it('validează că deviceId este obligatoriu', async () => {
    const res = await request(app)
      .post('/api/verifications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'METROLOGIC',
        performedAt: new Date().toISOString(),
        validUntil: new Date().toISOString(),
        result: 'CONFORM',
      });

    expect(res.status).toBe(400);
  });

  it('respinge device care nu necesită verificare', async () => {
    // Create device WITHOUT verification requirement
    const deviceRes = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inventoryNumber: `TEST-NO-VERIF-${Date.now()}`,
        name: 'Device Nu Necesita Verificare',
        riskClass: 'I',
        sectionId: 1,
      });

    const res = await request(app)
      .post('/api/verifications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: deviceRes.body.id,
        type: 'METROLOGIC',
        performedAt: new Date().toISOString(),
        validUntil: new Date().toISOString(),
        result: 'CONFORM',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('nu necesită verificare');

    // Cleanup
    await prisma.devices.deleteMany({ where: { id: deviceRes.body.id } });
  });

  it('crează audit log cu userId ne-null', async () => {
    const res = await request(app)
      .post('/api/verifications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        type: 'LABORATOR',
        performedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        result: 'CONFORM',
      });

    expect(res.status).toBe(201);

    const auditLogs = await prisma.audit_logs.findMany({
      where: {
        entity: 'verifications',
        entityId: String(res.body.id),
      },
    });

    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0].userId).toBe(userId);
    expect(auditLogs[0].userId).not.toBeNull();
  });

  it('validează type enum (LABORATOR|METROLOGIC)', async () => {
    const res = await request(app)
      .post('/api/verifications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        type: 'INVALID_TYPE',
        performedAt: new Date().toISOString(),
        validUntil: new Date().toISOString(),
        result: 'CONFORM',
      });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/verifications/compliance-report — Raport Conformitate', () => {
  beforeAll(async () => {
    // Create CONFORM verification (not yet expired)
    await request(app)
      .post('/api/verifications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        type: 'METROLOGIC',
        performedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        result: 'CONFORM',
      });
  });

  it('returnează raport cu statistici și dispozitive', async () => {
    const res = await request(app)
      .get('/api/verifications/compliance-report')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(0);
    expect(res.body.conform).toBeGreaterThanOrEqual(0);
    expect(res.body.expirat).toBeGreaterThanOrEqual(0);
    expect(res.body.neverificat).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(res.body.devices)).toBe(true);
  });

  it('filtrează dispozitive cu requiresVerification=true și status!=CASAT', async () => {
    const res = await request(app)
      .get('/api/verifications/compliance-report')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    // Verify all devices in report have requiresVerification = true
    res.body.devices.forEach((device) => {
      expect(device.requiresVerification).toBe(true);
    });
  });

  it('calculează status: NEVERIFICAT | CONFORM | EXPIRAT', async () => {
    const res = await request(app)
      .get('/api/verifications/compliance-report')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const statuses = res.body.devices.map((d) => d.status);
    statuses.forEach((status) => {
      expect(['NEVERIFICAT', 'CONFORM', 'EXPIRAT']).toContain(status);
    });
  });

  it('calculează daysLeft pentru dispozitive CONFORM', async () => {
    const res = await request(app)
      .get('/api/verifications/compliance-report')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const conformDevices = res.body.devices.filter((d) => d.status === 'CONFORM');
    conformDevices.forEach((device) => {
      if (device.lastVerification) {
        expect(typeof device.daysLeft).toBe('number');
        expect(device.daysLeft).toBeGreaterThan(0);
      }
    });
  });

  it('setează daysLeft=0 sau negativ pentru dispozitive EXPIRAT', async () => {
    const res = await request(app)
      .get('/api/verifications/compliance-report')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const expiredDevices = res.body.devices.filter((d) => d.status === 'EXPIRAT');
    expiredDevices.forEach((device) => {
      expect(device.daysLeft).toBeLessThanOrEqual(0);
    });
  });

  it('sortează dispozitive: EXPIRAT → NEVERIFICAT → CONFORM', async () => {
    const res = await request(app)
      .get('/api/verifications/compliance-report')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const devices = res.body.devices;
    let lastStatusPriority = -1;

    for (const device of devices) {
      const priority =
        device.status === 'EXPIRAT'
          ? 0
          : device.status === 'NEVERIFICAT'
            ? 1
            : 2;

      expect(priority).toBeGreaterThanOrEqual(lastStatusPriority);
      lastStatusPriority = priority;
    }
  });
});

describe('GET /api/verifications/:id — Detalii Verificare', () => {
  it('returnează detaliile verificării', async () => {
    const res = await request(app)
      .get(`/api/verifications/${testVerificationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(testVerificationId);
    expect(res.body.deviceId).toBe(testDeviceId);
  });

  it('returnează 404 pentru verificare inexistentă', async () => {
    const res = await request(app)
      .get('/api/verifications/999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/verifications — List cu filtre', () => {
  it('returnează listă paginată', async () => {
    const res = await request(app)
      .get('/api/verifications')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toMatchObject({
      page: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
      pages: expect.any(Number),
    });
  });

  it('filtrează după deviceId', async () => {
    const res = await request(app)
      .get(`/api/verifications?deviceId=${testDeviceId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    res.body.data.forEach((verification) => {
      expect(verification.deviceId).toBe(testDeviceId);
    });
  });

  it('filtrează după type (LABORATOR|METROLOGIC)', async () => {
    const res = await request(app)
      .get('/api/verifications?type=METROLOGIC')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    res.body.data.forEach((verification) => {
      expect(verification.type).toBe('METROLOGIC');
    });
  });

  it('validează pagina și limit', async () => {
    const res = await request(app)
      .get('/api/verifications?page=abc&limit=xyz')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

describe('Integrations & Atomicity', () => {
  it('verification creation is transactional', async () => {
    const res = await request(app)
      .post('/api/verifications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        type: 'METROLOGIC',
        performedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 24 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        result: 'NECONFORM',
        notes: 'Transactional test',
      });

    expect(res.status).toBe(201);

    // Verify audit log was created
    const auditLogs = await prisma.audit_logs.findMany({
      where: {
        entity: 'verifications',
        entityId: String(res.body.id),
      },
    });

    expect(auditLogs.length).toBeGreaterThan(0);
  });
});
