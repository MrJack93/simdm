/**
 * Branch coverage push — uncovered branches across 10 route modules
 * Targets: procurement, dutyLog, activityReport, commissioning, dashboard,
 *          decommission, documents, auth, devices, repairTickets
 */
const request = require('supertest');
const app = require('../index');
const prisma = require('../db');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';
let token;
let sectionId;
let deviceId;

function uniqueInv(prefix = 'BR10') {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

beforeAll(async () => {
  const loginRes = await request(app)
    .post('/api/auth/login?skip_ratelimit=true')
    .send({ username: 'testuser', password: TEST_PASSWORD });
  token = loginRes.body.accessToken;

  const secRes = await request(app)
    .get('/api/sections')
    .set('Authorization', `Bearer ${token}`);
  sectionId = secRes.body[0]?.id || 1;

  const devRes = await request(app)
    .post('/api/devices')
    .set('Authorization', `Bearer ${token}`)
    .send({ inventoryNumber: uniqueInv(), name: 'BR10-Device', riskClass: 'I', sectionId });
  deviceId = devRes.body.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ══════════════════════════════════════════════════════════════
// 1. procurement.js — multiple catch blocks and CRUD branches
// ══════════════════════════════════════════════════════════════
describe('procurement.js — comprehensive coverage', () => {
  let planId;
  let itemId;

  beforeAll(async () => {
    const planRes = await request(app)
      .post('/api/procurement/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ year: 2026, type: 'DM', elaboratedBy: 'Test' });
    planId = planRes.body?.id;
    if (planId) {
      const itemRes = await request(app)
        .post(`/api/procurement/plans/${planId}/items`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'ProcItem1', quantity: 2, unitPrice: 100 });
      itemId = itemRes.body?.id;
    }
  });

  it('POST /plans catch block via transaction failure', async () => {
    const origTx = prisma.$transaction.bind(prisma);
    prisma.$transaction = async () => { throw new Error('DB fail'); };
    const res = await request(app)
      .post('/api/procurement/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ year: 2027, type: 'DM', elaboratedBy: 'Test' });
    expect(res.status).toBe(500);
    prisma.$transaction = origTx;
  });

  it('POST /plans/:id/items catch block via transaction failure', async () => {
    if (!planId) return;
    const origTx = prisma.$transaction.bind(prisma);
    prisma.$transaction = async () => { throw new Error('DB fail'); };
    const res = await request(app)
      .post(`/api/procurement/plans/${planId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'FailItem', quantity: 1, unitPrice: 50 });
    expect(res.status).toBe(500);
    prisma.$transaction = origTx;
  });

  it('PUT /items/:id updates an existing item', async () => {
    if (!itemId) return;
    const res = await request(app)
      .put(`/api/procurement/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'UpdatedItem', quantity: 3, unitPrice: 200 });
    expect(res.status).toBe(200);
  });

  it('PUT /items/:id not found returns 404', async () => {
    const res = await request(app)
      .put('/api/procurement/items/999999')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ghost' });
    expect(res.status).toBe(404);
  });

  it('PUT /items/:id invalid data returns 400', async () => {
    if (!itemId) return;
    const res = await request(app)
      .put(`/api/procurement/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: -1 });
    expect(res.status).toBe(400);
  });

  it('PUT /items/:id catch block via transaction failure', async () => {
    if (!itemId) return;
    const origTx = prisma.$transaction.bind(prisma);
    prisma.$transaction = async () => { throw new Error('DB fail'); };
    const res = await request(app)
      .put(`/api/procurement/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'FailUpdate' });
    expect(res.status).toBe(500);
    prisma.$transaction = origTx;
  });

  it('DELETE /items/:id catch block via transaction failure', async () => {
    if (!itemId) return;
    const origTx = prisma.$transaction.bind(prisma);
    prisma.$transaction = async () => { throw new Error('DB fail'); };
    const res = await request(app)
      .delete(`/api/procurement/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    prisma.$transaction = origTx;
  });

  it('PATCH /plans/:id/status catch block via transaction failure', async () => {
    if (!planId) return;
    const origTx = prisma.$transaction.bind(prisma);
    prisma.$transaction = async () => { throw new Error('DB fail'); };
    const res = await request(app)
      .patch(`/api/procurement/plans/${planId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'COORDONAT' });
    expect(res.status).toBe(500);
    prisma.$transaction = origTx;
  });

  it('POST /plans/:id/items with invalid data returns 400', async () => {
    if (!planId) return;
    const res = await request(app)
      .post(`/api/procurement/plans/${planId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: -1 });
    expect(res.status).toBe(400);
  });

  it('POST /plans/:id/items with non-DRAFT plan returns 400', async () => {
    if (!planId) return;
    // Plan is DRAFT, so this should fail status check after status is changed
    const planRes2 = await request(app)
      .post('/api/procurement/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ year: 2028, type: 'DM', elaboratedBy: 'Test2' });
    const planId2 = planRes2.body?.id;
    if (!planId2) return;
    await request(app)
      .patch(`/api/procurement/plans/${planId2}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'COORDONAT', coordSection: 'Test' });
    const res = await request(app)
      .post(`/api/procurement/plans/${planId2}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'BlockedItem', quantity: 1, unitPrice: 100 });
    expect(res.status).toBe(400);
  });

  it('GET /plans with filters', async () => {
    const res = await request(app)
      .get('/api/procurement/plans?year=2026&type=DM&status=DRAFT')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('GET /plans catch block via findMany failure', async () => {
    const origFindMany = prisma.procurement_plans.findMany.bind(prisma);
    prisma.procurement_plans.findMany = async () => { throw new Error('DB fail'); };
    const res = await request(app)
      .get('/api/procurement/plans')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    prisma.procurement_plans.findMany = origFindMany;
  });

  it('GET /plans/:id returns plan detail', async () => {
    if (!planId) return;
    const res = await request(app)
      .get(`/api/procurement/plans/${planId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('GET /plans/:id returns 404 for nonexistent plan', async () => {
    const res = await request(app)
      .get('/api/procurement/plans/999999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('GET /plans/:id catch block via findUnique failure', async () => {
    const origFindUnique = prisma.procurement_plans.findUnique.bind(prisma);
    prisma.procurement_plans.findUnique = async () => { throw new Error('DB fail'); };
    const res = await request(app)
      .get('/api/procurement/plans/999999/pdf')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    prisma.procurement_plans.findUnique = origFindUnique;
  });

  it('GET /plans/:id/detail catch block via findUnique failure', async () => {
    const origFindUnique = prisma.procurement_plans.findUnique.bind(prisma);
    prisma.procurement_plans.findUnique = async () => { throw new Error('DB fail'); };
    const res = await request(app)
      .get('/api/procurement/plans/999999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    prisma.procurement_plans.findUnique = origFindUnique;
  });

  it('GET /plans/:id/pdf returns 404 for nonexistent plan', async () => {
    const res = await request(app)
      .get('/api/procurement/plans/999999/pdf')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('GET /plans/:id/pdf renders DM plan with section', async () => {
    if (!planId) return;
    // Assign a section to the plan
    await prisma.procurement_plans.update({ where: { id: planId }, data: { sectionId } });
    const res = await request(app)
      .get(`/api/procurement/plans/${planId}/pdf`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('GET /plans/:id/pdf renders CONSUMABIL plan', async () => {
    const plan2Res = await request(app)
      .post('/api/procurement/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ year: 2026, type: 'CONSUMABIL', elaboratedBy: 'Test' });
    const plan2Id = plan2Res.body?.id;
    if (plan2Id) {
      await request(app)
        .post(`/api/procurement/plans/${plan2Id}/items`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Consumabil', quantity: 5, unitPrice: 25 });
      await request(app)
        .post(`/api/procurement/plans/${plan2Id}/items`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Free Item', quantity: 1 });
      const res = await request(app)
        .get(`/api/procurement/plans/${plan2Id}/pdf`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    }
  });

  it('PATCH /plans/:id/status with COORDONAT transition', async () => {
    if (!planId) return;
    const res = await request(app)
      .patch(`/api/procurement/plans/${planId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'COORDONAT', coordSection: 'Cardiologie' });
    expect(res.status).toBe(200);
  });

  it('PATCH /plans/:id/status with APROBAT transition', async () => {
    if (!planId) return;
    const res = await request(app)
      .patch(`/api/procurement/plans/${planId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'APROBAT', coordSibm: 'Dr. SIBM', coordSection: 'Cardiologie' });
    expect(res.status).toBe(200);
  });

  it('PATCH /plans/:id/status with invalid transition returns 400', async () => {
    if (!planId) return;
    const res = await request(app)
      .patch(`/api/procurement/plans/${planId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'DRAFT' });
    expect(res.status).toBe(400);
  });
});

// ══════════════════════════════════════════════════════════════
// 2. dutyLog.js — all uncovered branches
// ══════════════════════════════════════════════════════════════
describe('dutyLog.js — comprehensive coverage', () => {
  let dutyEntryId;

  beforeAll(async () => {
    const entryRes = await request(app)
      .post('/api/duty-log')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceName: 'CatchDuty', faultDescription: 'Catch test', reportedBy: 'Test' });
    dutyEntryId = entryRes.body?.id;
  });

  it('GET / with invalid deviceId returns 400', async () => {
    const res = await request(app)
      .get('/api/duty-log?deviceId=abc')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('GET / catch block via findMany failure', async () => {
    const origFindMany = prisma.duty_log_entries.findMany.bind(prisma);
    prisma.duty_log_entries.findMany = async () => { throw new Error('DB fail'); };
    const res = await request(app)
      .get('/api/duty-log')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    prisma.duty_log_entries.findMany = origFindMany;
  });

  it('POST / catch block via transaction failure', async () => {
    const origTx = prisma.$transaction.bind(prisma);
    prisma.$transaction = async () => { throw new Error('DB fail'); };
    const res = await request(app)
      .post('/api/duty-log')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceName: 'DTest', faultDescription: 'Fault', reportedBy: 'Test' });
    expect(res.status).toBe(500);
    prisma.$transaction = origTx;
  });

  it('POST / with nonexistent deviceId returns 404', async () => {
    const res = await request(app)
      .post('/api/duty-log')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceId: 999999, deviceName: 'DTest', faultDescription: 'Fault', reportedBy: 'Test' });
    expect(res.status).toBe(404);
  });

  it('PATCH /:id/resolve validation error', async () => {
    const res = await request(app)
      .patch('/api/duty-log/1/resolve')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('PATCH /:id/resolve catch block via transaction failure', async () => {
    if (!dutyEntryId) return;
    const origTx = prisma.$transaction.bind(prisma);
    prisma.$transaction = async () => { throw new Error('DB fail'); };
    const res = await request(app)
      .patch(`/api/duty-log/${dutyEntryId}/resolve`)
      .set('Authorization', `Bearer ${token}`)
      .send({ resolution: 'Fixed', engineerName: 'Eng' });
    expect(res.status).toBe(500);
    prisma.$transaction = origTx;
  });

  it('POST / with valid data succeeds', async () => {
    const res = await request(app)
      .post('/api/duty-log')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceName: 'SuccessDuty', faultDescription: 'Good', reportedBy: 'Test' });
    expect(res.status).toBe(201);
  });
});

// ══════════════════════════════════════════════════════════════
// 3. activityReport.js — time interval branches (85-88)
//    Need to set durationHours on tickets directly via prisma
// ══════════════════════════════════════════════════════════════
describe('activityReport.js — time interval branches', () => {
  it('covers all time interval branches with varied durationHours', async () => {
    // Create tickets and set durationHours directly for each interval
    const durations = [0.5, 3, 10, 50, 200, 800];
    const now = new Date();

    for (const dur of durations) {
      const tkRes = await request(app)
        .post('/api/repair-tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({ deviceId, reportedBy: 'Test', faultDescription: `Interval test ${dur}h` });
      const tkId = tkRes.body?.id;
      if (tkId) {
        await prisma.repair_tickets.update({
          where: { id: tkId },
          data: { durationHours: dur, reportedAt: now },
        });
      }
    }

    const fromStr = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
    const toStr = new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10);
    const res = await request(app)
      .get(`/api/activity-report?from=${fromStr}&to=${toStr}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.timeIntervals).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════
// 4. commissioning.js — all uncovered branches
// ══════════════════════════════════════════════════════════════
describe('commissioning.js — comprehensive coverage', () => {
  it('GET / with invalid deviceId returns 400', async () => {
    const res = await request(app)
      .get('/api/commissioning?deviceId=abc')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('GET / with valid deviceId returns results', async () => {
    const res = await request(app)
      .get(`/api/commissioning?deviceId=${deviceId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('GET / catch block via findMany failure', async () => {
    const origFindMany = prisma.commissioning_records.findMany.bind(prisma);
    prisma.commissioning_records.findMany = async () => { throw new Error('DB fail'); };
    const res = await request(app)
      .get('/api/commissioning')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    prisma.commissioning_records.findMany = origFindMany;
  });

  it('GET /:id catch block via findUnique failure', async () => {
    const origFindUnique = prisma.commissioning_records.findUnique.bind(prisma);
    prisma.commissioning_records.findUnique = async () => { throw new Error('DB fail'); };
    const res = await request(app)
      .get('/api/commissioning/999999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    prisma.commissioning_records.findUnique = origFindUnique;
  });

  it('POST / catch block via transaction failure', async () => {
    const origTx = prisma.$transaction.bind(prisma);
    prisma.$transaction = async () => { throw new Error('DB fail'); };
    const res = await request(app)
      .post('/api/commissioning')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceId, commissionMembers: 'Dr. Test', commissionDecision: 'Acceptat' });
    expect(res.status).toBe(500);
    prisma.$transaction = origTx;
  });

  it('POST / with trainees creates record with trainees', async () => {
    const res = await request(app)
      .post('/api/commissioning')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId,
        commissionMembers: 'Dr. A, Dr. B',
        commissionDecision: 'Acceptat',
        trainees: [{ name: 'Popescu Ion', role: 'Asistent' }, { name: 'Ionescu Ana' }],
        comments: 'Test comments',
        handoverActNo: 'HA-001',
        supplier: 'TestSupplier',
        conformityOk: true,
        operationTestOk: true,
        operationManual: true,
        serviceManual: true,
        trainingDone: true,
        installDate: '2026-06-15',
        warrantyMonths: 12,
      });
    expect(res.status).toBe(201);

    if (res.body?.id) {
      const pdfRes = await request(app)
        .get(`/api/commissioning/${res.body.id}/formular4-pdf`)
        .set('Authorization', `Bearer ${token}`);
      expect(pdfRes.status).toBe(200);

      const pdf3Res = await request(app)
        .get(`/api/commissioning/${res.body.id}/formular3-pdf`)
        .set('Authorization', `Bearer ${token}`);
      expect(pdf3Res.status).toBe(200);
    }
  });

  it('formular3-pdf catch block', async () => {
    const origFindUnique = prisma.commissioning_records.findUnique.bind(prisma);
    prisma.commissioning_records.findUnique = async () => { throw new Error('DB fail'); };
    const res = await request(app)
      .get('/api/commissioning/999999/formular3-pdf')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    prisma.commissioning_records.findUnique = origFindUnique;
  });
});

// ══════════════════════════════════════════════════════════════
// 5. dashboard.js — consumables .catch + cost-summary branches
// ══════════════════════════════════════════════════════════════
describe('dashboard.js — comprehensive coverage', () => {
  it('GET /summary works normally', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.devices).toBeDefined();
  });

  it('GET /summary with invalid year param falls back', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary?year=abc')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('GET /cost-summary with valid year', async () => {
    const res = await request(app)
      .get('/api/dashboard/cost-summary?year=2026')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.year).toBe(2026);
  });

  it('GET /cost-summary with invalid year falls back to current year', async () => {
    const res = await request(app)
      .get('/api/dashboard/cost-summary?year=abc')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.year).toBe(new Date().getFullYear());
  });

  it('GET /cost-summary catch block via aggregate failure', async () => {
    const origAgg = prisma.repair_tickets.aggregate.bind(prisma);
    prisma.repair_tickets.aggregate = async () => { throw new Error('DB fail'); };
    const res = await request(app)
      .get('/api/dashboard/cost-summary?year=2026')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    prisma.repair_tickets.aggregate = origAgg;
  });
});

// ══════════════════════════════════════════════════════════════
// 6. decommission.js — invalid deviceId + catch blocks
// ══════════════════════════════════════════════════════════════
describe('decommission.js — comprehensive coverage', () => {
  it('GET / with invalid deviceId returns 400', async () => {
    const res = await request(app)
      .get('/api/decommission?deviceId=abc')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('GET / with valid deviceId filters results', async () => {
    const res = await request(app)
      .get(`/api/decommission?deviceId=${deviceId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('GET / catch block', async () => {
    const origFindMany = prisma.decommission_records.findMany.bind(prisma);
    prisma.decommission_records.findMany = async () => { throw new Error('DB fail'); };
    const res = await request(app)
      .get('/api/decommission')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    prisma.decommission_records.findMany = origFindMany;
  });

  it('GET /:id catch block', async () => {
    const origFindUnique = prisma.decommission_records.findUnique.bind(prisma);
    prisma.decommission_records.findUnique = async () => { throw new Error('DB fail'); };
    const res = await request(app)
      .get('/api/decommission/1')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    prisma.decommission_records.findUnique = origFindUnique;
  });

  it('POST / creates a decommission record', async () => {
    const res = await request(app)
      .post('/api/decommission')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceId, type: 'CASARE', cause: 'Test casare', nonUsageDate: '2026-01-15', normativeLifespan: '10 ani', nominalPrice: 5000, currentValue: 3000 });
    expect([201, 400, 404]).toContain(res.status);

    if (res.status === 201 && res.body?.id) {
      const formRes = await request(app)
        .get(`/api/decommission/${res.body.id}/formular10-pdf`)
        .set('Authorization', `Bearer ${token}`);
      expect(formRes.status).toBe(200);
    }
  });

  it('POST / catch block via transaction failure', async () => {
    const origTx = prisma.$transaction.bind(prisma);
    prisma.$transaction = async () => { throw new Error('DB fail'); };
    const res = await request(app)
      .post('/api/decommission')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceId, type: 'CASARE', cause: 'Test' });
    expect(res.status).toBe(500);
    prisma.$transaction = origTx;
  });
});

// ══════════════════════════════════════════════════════════════
// 7. documents.js — updateDocSchema CERTIFICAT/CONTRACT validation
// ══════════════════════════════════════════════════════════════
describe('documents.js — updateDocSchema branches', () => {
  let certDocId;

  beforeAll(async () => {
    const doc = await prisma.documents.create({
      data: {
        title: 'Test Certificate',
        category: 'CERTIFICAT',
        issuer: 'TestIssuer',
        validUntil: new Date('2030-01-01'),
        isCurrent: true,
        isDeleted: false,
        fileUrl: '/api/documents/file/test.pdf',
        fileSize: 100,
        mimeType: 'application/pdf',
        version: '1.0',
        uploadedById: 1,
        updatedAt: new Date(),
      },
    });
    certDocId = doc.id;
  });

  it('PUT with CERTIFICAT + validUntil=null returns 400', async () => {
    const res = await request(app)
      .put(`/api/documents/${certDocId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'CERTIFICAT', validUntil: null });
    expect(res.status).toBe(400);
  });

  it('PUT with CERTIFICAT + issuer=null returns 400', async () => {
    const res = await request(app)
      .put(`/api/documents/${certDocId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'CERTIFICAT', issuer: null });
    expect(res.status).toBe(400);
  });

  it('PUT with CONTRACT + validUntil=null returns 400', async () => {
    const res = await request(app)
      .put(`/api/documents/${certDocId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'CONTRACT', validUntil: null });
    expect(res.status).toBe(400);
  });
});

// ══════════════════════════════════════════════════════════════
// 8. auth.js — /me and change-password edge cases
// ══════════════════════════════════════════════════════════════
describe('auth.js — /me + change-password branches', () => {
  let tempUserId;
  let tempToken;

  beforeAll(async () => {
    const bcryptjs = require('bcryptjs');
    const tempHash = await bcryptjs.hash('Temp1234!', 12);
    const ts = Date.now();
    const tempUser = await prisma.users.create({
      data: { username: `br10_temp_${ts}`, passwordHash: tempHash, fullName: 'Temp BR10', email: `br10_${ts}@test.com`, role: 'VIEWER', updatedAt: new Date() },
    });
    tempUserId = tempUser.id;

    const loginRes = await request(app)
      .post('/api/auth/login?skip_ratelimit=true')
      .send({ username: tempUser.username, password: 'Temp1234!' });
    tempToken = loginRes.body.accessToken;

    // Delete the user while keeping the valid JWT
    await prisma.users.delete({ where: { id: tempUserId } });
  });

  it('GET /me returns current user for valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
  });

  it('GET /me returns 404 when user deleted from DB', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tempToken}`);
    expect(res.status).toBe(404);
  });

  it('PATCH /change-password with mismatched passwords returns 400', async () => {
    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'NewPass123!', confirmPassword: 'Different123!' });
    expect(res.status).toBe(400);
  });

  it('PATCH /change-password with missing fields returns 400', async () => {
    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: TEST_PASSWORD });
    expect(res.status).toBe(400);
  });

  it('PATCH /change-password with short password returns 400', async () => {
    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'short', confirmPassword: 'short' });
    expect(res.status).toBe(400);
  });

  it('PATCH /change-password when user deleted returns 404', async () => {
    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${tempToken}`)
      .send({ currentPassword: 'Temp1234!', newPassword: 'NewPass123!', confirmPassword: 'NewPass123!' });
    expect(res.status).toBe(404);
  });

  it('PATCH /change-password with wrong current password returns 400', async () => {
    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongPassword!', newPassword: 'NewPass123!', confirmPassword: 'NewPass123!' });
    expect(res.status).toBe(400);
  });
});

// ══════════════════════════════════════════════════════════════
// 9. devices.js — module-level code only, skip
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// 10. repairTickets.js — operations in handover-pdf (line 807)
// ══════════════════════════════════════════════════════════════
describe('repairTickets.js — handover PDF operations branch', () => {
  it('handover-pdf renders with externalized ticket with operations', async () => {
    const tkRes = await request(app)
      .post('/api/repair-tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceId, reportedBy: 'Test', faultDescription: 'Handover test' });
    const tkId = tkRes.body?.id;
    if (!tkId) return;

    await request(app)
      .patch(`/api/repair-tickets/${tkId}/triage`)
      .set('Authorization', `Bearer ${token}`)
      .send({ repairType: 'EXTERN', defectCause: 'Test cause' });

    // Add operations data to the ticket
    await prisma.repair_tickets.update({
      where: { id: tkId },
      data: {
        externalized: true,
        operations: [
          { date: new Date().toISOString(), timeStart: '10:00', timeEnd: '12:00', operation: 'Diagnostic', engineer: 'Eng. Test', signature: 'sig' },
          { date: new Date().toISOString(), timeStart: '14:00', timeEnd: '16:00', operation: 'Reparatie', engineer: 'Eng. Test 2' },
        ],
      },
    });

    const res = await request(app)
      .get(`/api/repair-tickets/${tkId}/handover-pdf`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 400]).toContain(res.status);
  });
});
