/**
 * Teste pentru modulul Execuție MPP — /api/mpp-executions
 *
 * Testează:
 * - POST create execution cu tranzacție atomică
 * - Stock decrement cu validare suficiență
 * - Update occurrence status → EFECTUAT
 * - Update device lastMaintenanceAt
 * - Checklist template
 * - Audit log cu userId ne-null
 */
const request = require('supertest');
const app = require('../index');
const prisma = require('../db');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

let token;
let userId;
let testDeviceId;
let testConsumableId;
let testOccurrenceId;
let testPlanId;

beforeAll(async () => {
  // Login
  const loginRes = await request(app)
    .post('/api/auth/login?skip_ratelimit=true')
    .send({ username: 'testuser', password: TEST_PASSWORD });
  token = loginRes.body.accessToken;
  userId = loginRes.body.user.id;

  // Create test device
  const deviceRes = await request(app)
    .post('/api/devices')
    .set('Authorization', `Bearer ${token}`)
    .send({
      inventoryNumber: `TEST-MPP-EXEC-${Date.now()}`,
      name: 'Test Device for MPP Execution',
      riskClass: 'IIa',
      sectionId: 1,
      maintenanceFreq: 3, // Quarterly
    });
  testDeviceId = deviceRes.body.id;

  // Create test consumable
  const consumRes = await request(app)
    .post('/api/consumables')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: `Test Consumable ${Date.now()}`,
      quantity: 100,
      minQuantity: 10,
      unitOfMeasure: 'buc',
    });
  testConsumableId = consumRes.body.id;

  // Create maintenance plan to generate occurrence
  const planRes = await request(app)
    .post('/api/maintenance-plans/generate')
    .set('Authorization', `Bearer ${token}`)
    .send({
      deviceId: testDeviceId,
      year: 2026,
      frequency: 'TRIMESTRIAL',
      responsibleName: 'Ing. Test',
    });
  testPlanId = planRes.body.id;

  // Get first occurrence
  const calendarRes = await request(app)
    .get('/api/maintenance-plans/calendar?year=2026')
    .set('Authorization', `Bearer ${token}`);
  if (calendarRes.body.data && calendarRes.body.data.length > 0) {
    testOccurrenceId = calendarRes.body.data[0].id;
  }
});

afterAll(async () => {
  // Cleanup
  if (testConsumableId) {
    await prisma.consumables.deleteMany({ where: { id: testConsumableId } });
  }
  if (testPlanId) {
    const plans = await prisma.maintenance_plans.findMany({ where: { id: testPlanId } });
    for (const plan of plans) {
      await prisma.mpp_occurrences.deleteMany({ where: { planId: plan.id } });
    }
    await prisma.maintenance_plans.deleteMany({ where: { id: testPlanId } });
  }
  if (testDeviceId) {
    await prisma.mpp_executions.deleteMany({ where: { deviceId: testDeviceId } });
    await prisma.devices.deleteMany({ where: { id: testDeviceId } });
  }
});

describe('GET /api/mpp-executions/checklist-template/:deviceId', () => {
  it('fără token → 401', async () => {
    const res = await request(app).get(`/api/mpp-executions/checklist-template/${testDeviceId}`);
    expect(res.status).toBe(401);
  });

  it('returnează template generic cu 6 operațiuni standard', async () => {
    const res = await request(app)
      .get(`/api/mpp-executions/checklist-template/${testDeviceId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.checklist)).toBe(true);
    expect(res.body.checklist.length).toBe(6); // Standard template
    expect(res.body.deviceId).toBe(testDeviceId);
    expect(res.body.deviceName).toBeDefined();
  });

  it('fiecare operațiune conține: operatiune, bifat, nota', async () => {
    const res = await request(app)
      .get(`/api/mpp-executions/checklist-template/${testDeviceId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    res.body.checklist.forEach((item) => {
      expect(item).toHaveProperty('operatiune');
      expect(item).toHaveProperty('bifat');
      expect(item).toHaveProperty('nota');
    });
  });

  it('returnează 404 pentru device inexistent', async () => {
    const res = await request(app)
      .get('/api/mpp-executions/checklist-template/999999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/mpp-executions — Execuție MPP', () => {
  it('fără token → 401', async () => {
    const res = await request(app).post('/api/mpp-executions').send({});
    expect(res.status).toBe(401);
  });

  it('validează că deviceId este obligatoriu', async () => {
    const res = await request(app)
      .post('/api/mpp-executions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        executedDate: new Date().toISOString(),
        checklist: [],
        result: 'FUNCTIONAL',
        engineerName: 'Test',
      });
    expect(res.status).toBe(400);
  });

  it('validează că checklist este obligatoriu și JSONB', async () => {
    const res = await request(app)
      .post('/api/mpp-executions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        executedDate: new Date().toISOString(),
        result: 'FUNCTIONAL',
        engineerName: 'Test',
      });
    expect(res.status).toBe(400);
  });

  it('crează execuție cu date valide - FUNCTIONAL', async () => {
    const res = await request(app)
      .post('/api/mpp-executions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        executedDate: new Date().toISOString(),
        durationMinutes: 45,
        checklist: [
          { operatiune: 'Test 1', bifat: true, nota: 'OK' },
          { operatiune: 'Test 2', bifat: true, nota: '' },
        ],
        result: 'FUNCTIONAL',
        engineerName: 'Ing. Test Execution',
        notes: 'Totul bine',
      });
    expect(res.status).toBe(201);
    expect(res.body.result).toBe('FUNCTIONAL');
    expect(res.body.engineerName).toBe('Ing. Test Execution');
    expect(res.body.defectDetected).toBe(false);
  });

  it('crează execuție cu result = DEFECT și returnează flag', async () => {
    const res = await request(app)
      .post('/api/mpp-executions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        executedDate: new Date().toISOString(),
        checklist: [{ operatiune: 'Test', bifat: false, nota: 'Defect detectat' }],
        result: 'DEFECT',
        engineerName: 'Ing. Test',
      });
    expect(res.status).toBe(201);
    expect(res.body.result).toBe('DEFECT');
    expect(res.body.defectDetected).toBe(true);
    expect(res.body.message).toContain('corectiv');
  });

  it('scade consumabile din stoc (tranzacție atomică)', async () => {
    // Get initial stock
    const beforeRes = await request(app)
      .get('/api/consumables')
      .set('Authorization', `Bearer ${token}`);
    const consumableBefore = beforeRes.body.consumables.find(
      (c) => c.id === testConsumableId
    );
    const initialQty = consumableBefore.quantity;

    // Create execution with consumables
    const execRes = await request(app)
      .post('/api/mpp-executions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        executedDate: new Date().toISOString(),
        checklist: [{ operatiune: 'Test', bifat: true, nota: '' }],
        consumablesUsed: [{ consumableId: testConsumableId, qty: 5 }],
        result: 'FUNCTIONAL',
        engineerName: 'Ing. Test',
      });
    expect(execRes.status).toBe(201);

    // Verify stock decremented
    const afterRes = await request(app)
      .get('/api/consumables')
      .set('Authorization', `Bearer ${token}`);
    const consumableAfter = afterRes.body.consumables.find(
      (c) => c.id === testConsumableId
    );
    expect(consumableAfter.quantity).toBe(initialQty - 5);
  });

  it('respinge execuție cu stoc insuficient', async () => {
    const res = await request(app)
      .post('/api/mpp-executions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        executedDate: new Date().toISOString(),
        checklist: [{ operatiune: 'Test', bifat: true, nota: '' }],
        consumablesUsed: [{ consumableId: testConsumableId, qty: 999 }], // Way more than available
        result: 'FUNCTIONAL',
        engineerName: 'Ing. Test',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Stoc insuficient');
  });

  it('actualizează device lastMaintenanceAt', async () => {
    const executedDate = new Date('2026-03-15');
    const res = await request(app)
      .post('/api/mpp-executions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        executedDate: executedDate.toISOString(),
        checklist: [{ operatiune: 'Test', bifat: true, nota: '' }],
        result: 'FUNCTIONAL',
        engineerName: 'Ing. Test',
      });
    expect(res.status).toBe(201);

    const deviceRes = await request(app)
      .get(`/api/devices/${testDeviceId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(new Date(deviceRes.body.lastMaintenanceAt).toDateString()).toBe(
      executedDate.toDateString()
    );
  });

  it('actualizează occurrence status → EFECTUAT și linkează executionId', async () => {
    if (!testOccurrenceId) {
      console.log('⚠️  testOccurrenceId not set, skipping test');
      return;
    }

    const res = await request(app)
      .post('/api/mpp-executions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        occurrenceId: testOccurrenceId,
        executedDate: new Date().toISOString(),
        checklist: [{ operatiune: 'Test', bifat: true, nota: '' }],
        result: 'FUNCTIONAL',
        engineerName: 'Ing. Test',
      });
    expect(res.status).toBe(201);

    const occurrence = await prisma.mpp_occurrences.findUnique({
      where: { id: testOccurrenceId },
    });
    expect(occurrence.status).toBe('EFECTUAT');
    expect(occurrence.executionId).toBe(res.body.id);
  });

  it('crează audit log cu userId ne-null', async () => {
    const res = await request(app)
      .post('/api/mpp-executions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        executedDate: new Date().toISOString(),
        checklist: [{ operatiune: 'Test', bifat: true, nota: '' }],
        result: 'FUNCTIONAL',
        engineerName: 'Ing. Test Audit',
      });
    expect(res.status).toBe(201);

    const auditLogs = await prisma.audit_logs.findMany({
      where: {
        entity: 'mpp_executions',
        entityId: String(res.body.id),
      },
    });
    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0].userId).toBe(userId);
    expect(auditLogs[0].userId).not.toBeNull();
  });
});

describe('GET /api/mpp-executions/:id', () => {
  let executionId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/mpp-executions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        executedDate: new Date().toISOString(),
        checklist: [{ operatiune: 'Test', bifat: true, nota: '' }],
        result: 'FUNCTIONAL',
        engineerName: 'Ing. Test',
      });
    executionId = res.body.id;
  });

  it('returnează detaliile execuției', async () => {
    const res = await request(app)
      .get(`/api/mpp-executions/${executionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(executionId);
    expect(res.body.result).toBe('FUNCTIONAL');
  });

  it('returnează 404 pentru execuție inexistentă', async () => {
    const res = await request(app)
      .get('/api/mpp-executions/999999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/mpp-executions — List cu filtre', () => {
  it('returnează listă paginată', async () => {
    const res = await request(app)
      .get('/api/mpp-executions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toMatchObject({
      page: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
    });
  });

  it('filtrează după deviceId', async () => {
    const res = await request(app)
      .get(`/api/mpp-executions?deviceId=${testDeviceId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((exec) => {
      expect(exec.deviceId).toBe(testDeviceId);
    });
  });

  it('filtrează după result (FUNCTIONAL/DEFECT)', async () => {
    const res = await request(app)
      .get('/api/mpp-executions?result=FUNCTIONAL')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((exec) => {
      expect(exec.result).toBe('FUNCTIONAL');
    });
  });
});

describe('DELETE /api/mpp-executions/:id — Anulare cu revert stock', () => {
  let executionId;
  let consumableQtyBefore;

  beforeAll(async () => {
    // Get consumable qty before
    const beforeRes = await request(app)
      .get('/api/consumables')
      .set('Authorization', `Bearer ${token}`);
    const consumable = beforeRes.body.consumables.find(
      (c) => c.id === testConsumableId
    );
    consumableQtyBefore = consumable.quantity;

    // Create execution with consumable usage
    const res = await request(app)
      .post('/api/mpp-executions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        executedDate: new Date().toISOString(),
        checklist: [{ operatiune: 'Test', bifat: true, nota: '' }],
        consumablesUsed: [{ consumableId: testConsumableId, qty: 3 }],
        result: 'FUNCTIONAL',
        engineerName: 'Ing. Test Delete',
      });
    executionId = res.body.id;
  });

  it('anulează execuție și restituie stoc', async () => {
    const res = await request(app)
      .delete(`/api/mpp-executions/${executionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('anulată');

    // Verify stock restored
    const afterRes = await request(app)
      .get('/api/consumables')
      .set('Authorization', `Bearer ${token}`);
    const consumable = afterRes.body.consumables.find(
      (c) => c.id === testConsumableId
    );
    expect(consumable.quantity).toBe(consumableQtyBefore);
  });
});
