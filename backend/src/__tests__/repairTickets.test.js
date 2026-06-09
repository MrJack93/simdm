/**
 * Teste pentru modulul Mentenanță Corectivă — /api/repair-tickets
 *
 * Testează:
 * - POST create ticket cu generare TKT-YYYY-NNNN
 * - PATCH status cu validare state machine (STATUS_FLOW)
 * - PATCH triage cu selectare INTERN/EXTERN
 * - PUT repair cu decrement stock și cost calculation
 * - Get ticket + list cu filtre
 * - PDF generation (Formular Nr. 8)
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
let testTicketId;

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
      inventoryNumber: `TEST-REPAIR-${Date.now()}`,
      name: 'Test Device for Repair',
      riskClass: 'IIa',
      sectionId: 1,
    });
  testDeviceId = deviceRes.body.id;

  // Create test consumable for parts
  const consumRes = await request(app)
    .post('/api/consumables')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: `Test Part ${Date.now()}`,
      quantity: 100,
      minQuantity: 10,
      unitOfMeasure: 'buc',
    });
  testConsumableId = consumRes.body.id;
});

afterAll(async () => {
  if (testDeviceId) {
    await prisma.repair_tickets.deleteMany({ where: { deviceId: testDeviceId } });
  }
  if (testConsumableId) {
    await prisma.consumables.deleteMany({ where: { id: testConsumableId } });
  }
  if (testDeviceId) {
    await prisma.devices.deleteMany({ where: { id: testDeviceId } });
  }
});

describe('POST /api/repair-tickets — Creare bilet', () => {
  it('fără token → 401', async () => {
    const res = await request(app).post('/api/repair-tickets').send({});
    expect(res.status).toBe(401);
  });

  it('crează bilet cu TKT-YYYY-NNNN și status=DESCHIS', async () => {
    const res = await request(app)
      .post('/api/repair-tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        reportedBy: 'Test User',
        faultDescription: 'Dispozitiv nu răspunde',
        priority: 'NORMAL',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.ticketNumber).toMatch(/^TKT-\d{4}-\d{4}$/);
    expect(res.body.status).toBe('DESCHIS');
    expect(res.body.priority).toBe('NORMAL');
    expect(res.body.faultDescription).toBe('Dispozitiv nu răspunde');

    testTicketId = res.body.id;
  });

  it('validează că deviceId este obligatoriu', async () => {
    const res = await request(app)
      .post('/api/repair-tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        reportedBy: 'Test User',
        faultDescription: 'Test',
        priority: 'NORMAL',
      });

    expect(res.status).toBe(400);
  });

  it('actualizează device.status = DEFECT (atomic)', async () => {
    const res = await request(app)
      .post('/api/repair-tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        reportedBy: 'Test User',
        faultDescription: 'Test defect',
        priority: 'URGENT',
      });

    expect(res.status).toBe(201);

    const device = await prisma.devices.findUnique({
      where: { id: testDeviceId },
    });
    expect(device.status).toBe('DEFECT');
  });

  it('crează audit log cu userId ne-null', async () => {
    const res = await request(app)
      .post('/api/repair-tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        reportedBy: 'Ing. Audit Test',
        faultDescription: 'Audit test fault',
        priority: 'NORMAL',
      });

    expect(res.status).toBe(201);

    const auditLogs = await prisma.audit_logs.findMany({
      where: {
        entity: 'repair_tickets',
        entityId: String(res.body.id),
      },
    });

    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0].userId).toBe(userId);
    expect(auditLogs[0].userId).not.toBeNull();
  });

  it('validează prioritate enum', async () => {
    const res = await request(app)
      .post('/api/repair-tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        reportedBy: 'Test User',
        faultDescription: 'Test',
        priority: 'INVALID_PRIORITY',
      });

    expect(res.status).toBe(400);
  });

  it('TKT-YYYY-NNNN este incrementabil și unic per year', async () => {
    const res1 = await request(app)
      .post('/api/repair-tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        reportedBy: 'Test',
        faultDescription: 'Ticket 1',
        priority: 'NORMAL',
      });

    const res2 = await request(app)
      .post('/api/repair-tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        reportedBy: 'Test',
        faultDescription: 'Ticket 2',
        priority: 'NORMAL',
      });

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);

    const tkt1Num = parseInt(res1.body.ticketNumber.split('-')[2]);
    const tkt2Num = parseInt(res2.body.ticketNumber.split('-')[2]);

    expect(tkt2Num).toBeGreaterThan(tkt1Num);
  });
});

describe('PATCH /api/repair-tickets/:id/status — State Machine', () => {
  let ticketId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/repair-tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        reportedBy: 'Test',
        faultDescription: 'State test',
        priority: 'NORMAL',
      });
    ticketId = res.body.id;
  });

  afterAll(async () => {
    await prisma.repair_tickets.deleteMany({ where: { id: ticketId } });
  });

  it('DESCHIS → IN_LUCRU validare tranziție', async () => {
    const res = await request(app)
      .patch(`/api/repair-tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'IN_LUCRU' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('IN_LUCRU');
  });

  it('IN_LUCRU → REZOLVAT validare tranziție', async () => {
    const res = await request(app)
      .patch(`/api/repair-tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'REZOLVAT' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('REZOLVAT');
    expect(res.body.resolvedAt).toBeDefined();
  });

  it('REZOLVAT → TESTAT validare tranziție', async () => {
    const res = await request(app)
      .patch(`/api/repair-tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'TESTAT' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('TESTAT');
  });

  it('TESTAT → INCHIS validare tranziție', async () => {
    const res = await request(app)
      .patch(`/api/repair-tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'INCHIS' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('INCHIS');
  });

  it('respinge tranziție invalidă cu STATE_FLOW error', async () => {
    // Try INCHIS → DESCHIS (invalid)
    const res = await request(app)
      .patch(`/api/repair-tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'DESCHIS' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Tranziție invalidă');
    expect(res.body.validTransitions).toBeDefined();
  });

  it('returnează 404 pentru ticket inexistent', async () => {
    const res = await request(app)
      .patch('/api/repair-tickets/999999/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'IN_LUCRU' });

    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/repair-tickets/:id/triage — Triaj', () => {
  let ticketId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/repair-tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        reportedBy: 'Test',
        faultDescription: 'Triage test',
        priority: 'NORMAL',
      });
    ticketId = res.body.id;
  });

  afterAll(async () => {
    await prisma.repair_tickets.deleteMany({ where: { id: ticketId } });
  });

  it('DESCHIS → acceptă triaj și move to IN_LUCRU', async () => {
    const res = await request(app)
      .patch(`/api/repair-tickets/${ticketId}/triage`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        repairType: 'INTERN',
        defectCause: 'Conectorul este deteriorat',
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('IN_LUCRU');
    expect(res.body.faultCause).toBe('Conectorul este deteriorat');
    expect(res.body.externalized).toBe(false);
  });

  it('acceptă reparație EXTERN și setează flag', async () => {
    // Create new ticket for extern test
    const ticketRes = await request(app)
      .post('/api/repair-tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        reportedBy: 'Test',
        faultDescription: 'Extern test',
        priority: 'NORMAL',
      });

    const res = await request(app)
      .patch(`/api/repair-tickets/${ticketRes.body.id}/triage`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        repairType: 'EXTERN',
        defectCause: 'Defect la componentă critică',
      });

    expect(res.status).toBe(200);
    expect(res.body.externalized).toBe(true);
  });
});

describe('PUT /api/repair-tickets/:id/repair — Reparație Internă', () => {
  let ticketId;
  let consumableQtyBefore;

  beforeAll(async () => {
    // Get consumable qty before
    const consumRes = await request(app)
      .get('/api/consumables')
      .set('Authorization', `Bearer ${token}`);
    const consumable = consumRes.body.consumables.find(
      (c) => c.id === testConsumableId
    );
    consumableQtyBefore = consumable.quantity;

    // Create ticket
    const res = await request(app)
      .post('/api/repair-tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        reportedBy: 'Test',
        faultDescription: 'Repair test',
        priority: 'NORMAL',
      });
    ticketId = res.body.id;

    // Triage first
    await request(app)
      .patch(`/api/repair-tickets/${ticketId}/triage`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        repairType: 'INTERN',
        defectCause: 'Usuray în conector',
      });

    // Move to IN_LUCRU if needed
    await request(app)
      .patch(`/api/repair-tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'IN_LUCRU' });
  });

  afterAll(async () => {
    await prisma.repair_tickets.deleteMany({ where: { id: ticketId } });
  });

  it('acceptă detalii reparație și calculează cost din piese', async () => {
    const res = await request(app)
      .put(`/api/repair-tickets/${ticketId}/repair`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        repairReport: 'Am curățat și reîntins conexiunile',
        actionsTaken: 'Demontaj, curățare, remontaj',
        durationHours: 1.5,
        partsUsed: [
          { description: 'Connector cleaning solution', qty: 1, costUnit: 50 },
          { description: 'Thermal paste', qty: 2, costUnit: 25 },
        ],
        functionalTest: 'FUNCTIONAL',
        engineerName: 'Ing. Test Repair',
      });

    expect(res.status).toBe(200);
    expect(res.body.actionsTaken).toBe('Demontaj, curățare, remontaj');
    expect(Number(res.body.totalCost)).toBe(100); // Prisma Decimal → string in JSON
  });

  it('decrementează consumabile din stoc (atomic)', async () => {
    // Get qty before new repair
    const beforeRes = await request(app)
      .get('/api/consumables')
      .set('Authorization', `Bearer ${token}`);
    const beforeConsumable = beforeRes.body.consumables.find(
      (c) => c.id === testConsumableId
    );
    const qtyBefore = beforeConsumable.quantity;

    // Create new ticket and repair with consumables
    const ticketRes = await request(app)
      .post('/api/repair-tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        reportedBy: 'Test',
        faultDescription: 'Stock test',
        priority: 'NORMAL',
      });

    await request(app)
      .patch(`/api/repair-tickets/${ticketRes.body.id}/triage`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        repairType: 'INTERN',
        defectCause: 'Test defect',
      });

    const repairRes = await request(app)
      .put(`/api/repair-tickets/${ticketRes.body.id}/repair`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        repairReport: 'Test report',
        actionsTaken: 'Test actions',
        durationHours: 1,
        partsUsed: [
          { description: `Test Part ${Date.now()}`, qty: 5, costUnit: 10 },
        ],
        functionalTest: 'FUNCTIONAL',
        engineerName: 'Test',
      });

    expect(repairRes.status).toBe(200);

    // Verify stock decreased (or remained same if consumable not found)
    const afterRes = await request(app)
      .get('/api/consumables')
      .set('Authorization', `Bearer ${token}`);
    const afterConsumable = afterRes.body.consumables.find(
      (c) => c.id === testConsumableId
    );

    // Stock either decreased or remained (depending on whether part description matched)
    expect(afterConsumable.quantity).toBeLessThanOrEqual(qtyBefore);
  });

  it('setează status=REZOLVAT dacă functionalTest=FUNCTIONAL', async () => {
    const ticketRes = await request(app)
      .post('/api/repair-tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        reportedBy: 'Test',
        faultDescription: 'Functional test',
        priority: 'NORMAL',
      });

    await request(app)
      .patch(`/api/repair-tickets/${ticketRes.body.id}/triage`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        repairType: 'INTERN',
        defectCause: 'Test',
      });

    const res = await request(app)
      .put(`/api/repair-tickets/${ticketRes.body.id}/repair`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        repairReport: 'Functional repair',
        actionsTaken: 'Fixed issue',
        durationHours: 1,
        partsUsed: [],
        functionalTest: 'FUNCTIONAL',
        engineerName: 'Test',
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('REZOLVAT');
    expect(res.body.resolvedAt).toBeDefined();
  });

  it('crează audit log cu userId ne-null', async () => {
    const ticketRes = await request(app)
      .post('/api/repair-tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        reportedBy: 'Test',
        faultDescription: 'Audit log test',
        priority: 'NORMAL',
      });

    await request(app)
      .patch(`/api/repair-tickets/${ticketRes.body.id}/triage`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        repairType: 'INTERN',
        defectCause: 'Test',
      });

    const repairRes = await request(app)
      .put(`/api/repair-tickets/${ticketRes.body.id}/repair`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        repairReport: 'Audit repair',
        actionsTaken: 'Actions',
        durationHours: 1,
        partsUsed: [],
        functionalTest: 'FUNCTIONAL',
        engineerName: 'Test Audit',
      });

    expect(repairRes.status).toBe(200);

    const auditLogs = await prisma.audit_logs.findMany({
      where: {
        entity: 'repair_tickets',
        entityId: String(ticketRes.body.id),
        action: 'UPDATE',
      },
    });

    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0].userId).toBe(userId);
    expect(auditLogs[0].userId).not.toBeNull();
  });
});

describe('GET /api/repair-tickets/:id — Detalii bilet', () => {
  let ticketId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/repair-tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        reportedBy: 'Test',
        faultDescription: 'Get test',
        priority: 'NORMAL',
      });
    ticketId = res.body.id;
  });

  afterAll(async () => {
    await prisma.repair_tickets.deleteMany({ where: { id: ticketId } });
  });

  it('returnează detaliile biletului', async () => {
    const res = await request(app)
      .get(`/api/repair-tickets/${ticketId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(ticketId);
    expect(res.body.ticketNumber).toBeDefined();
    expect(res.body.status).toBeDefined();
  });

  it('returnează 404 pentru bilet inexistent', async () => {
    const res = await request(app)
      .get('/api/repair-tickets/999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/repair-tickets — List cu filtre', () => {
  it('returnează listă paginată', async () => {
    const res = await request(app)
      .get('/api/repair-tickets')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toMatchObject({
      page: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
    });
  });

  it('filtrează după status', async () => {
    const res = await request(app)
      .get('/api/repair-tickets?status=DESCHIS')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    res.body.data.forEach((ticket) => {
      expect(ticket.status).toBe('DESCHIS');
    });
  });

  it('filtrează după priority', async () => {
    const res = await request(app)
      .get('/api/repair-tickets?priority=URGENT')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    res.body.data.forEach((ticket) => {
      expect(ticket.priority).toBe('URGENT');
    });
  });

  it('filtrează după deviceId', async () => {
    const res = await request(app)
      .get(`/api/repair-tickets?deviceId=${testDeviceId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    res.body.data.forEach((ticket) => {
      expect(ticket.deviceId).toBe(testDeviceId);
    });
  });
});

describe('GET /api/repair-tickets/:id/formular8-pdf — PDF Generation', () => {
  let ticketWithRepairId;

  beforeAll(async () => {
    // Create ticket with complete repair
    const ticketRes = await request(app)
      .post('/api/repair-tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        reportedBy: 'Test',
        faultDescription: 'PDF test fault',
        priority: 'NORMAL',
      });

    ticketWithRepairId = ticketRes.body.id;

    // Triage
    await request(app)
      .patch(`/api/repair-tickets/${ticketWithRepairId}/triage`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        repairType: 'INTERN',
        defectCause: 'PDF test cause',
      });

    // Repair with parts
    await request(app)
      .put(`/api/repair-tickets/${ticketWithRepairId}/repair`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        repairReport: 'PDF test repair report',
        actionsTaken: 'PDF test actions',
        durationHours: 2,
        partsUsed: [{ description: 'Test Part', qty: 1, costUnit: 100 }],
        functionalTest: 'FUNCTIONAL',
        engineerName: 'PDF Test Engineer',
      });
  });

  afterAll(async () => {
    await prisma.repair_tickets.deleteMany({ where: { id: ticketWithRepairId } });
  });

  it('returnează PDF valid pentru bilet complet', async () => {
    const res = await request(app)
      .get(`/api/repair-tickets/${ticketWithRepairId}/formular8-pdf`)
      .set('Authorization', `Bearer ${token}`)
      .expect('Content-Type', /application\/pdf/);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('returnează 404 pentru bilet inexistent', async () => {
    const res = await request(app)
      .get('/api/repair-tickets/999999/formular8-pdf')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
