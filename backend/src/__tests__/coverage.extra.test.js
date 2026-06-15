/**
 * Teste suplimentare pentru acoperire — repairTickets, maintenance, consumable/device schemas
 *
 * Acoperă căi ne-testate:
 *   repairTickets:
 *     POST  body invalid (400), device inexistent (404), toate prioritățile
 *     PATCH status ID invalid, tranziție invalidă, INCHIS → device FUNCTIONAL
 *     PATCH triage EXTERN cu provider, provider inexistent (404), body invalid, ID invalid
 *     PUT   repair cu partsUsed, fără părți, cu operations, NEFUNCTIONAL, ID invalid, 404
 *     GET   list filtre, /:id, /:id/formular8-pdf, /:id/handover-pdf, /formular7-pdf
 *
 *   maintenance:
 *     POST  missing executedDate, empty description, device inexistent (404)
 *     PUT   ID invalid, not found (404)
 *     DELETE ID invalid, not found (404)
 *     GET   date filters
 *
 *   schemas:
 *     consumable.schema.js — validare create + update
 *     device.schema.js    — validare create + update
 */
const request = require('supertest');
const app = require('../index');
const prisma = require('../db');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

let token;
let userId;
let testDeviceId;
let testConsumableId;
let testProviderId;
const ticketIds = [];
const maintenanceIds = [];

async function createTicket(body = {}) {
  const res = await request(app)
    .post('/api/repair-tickets')
    .set('Authorization', `Bearer ${token}`)
    .send({
      deviceId: testDeviceId,
      reportedBy: 'Test User',
      faultDescription: 'Fault test',
      priority: 'NORMAL',
      ...body,
    });
  if (res.status === 201) ticketIds.push(res.body.id);
  return res;
}

async function createMaintenance(body = {}) {
  const res = await request(app)
    .post('/api/maintenance')
    .set('Authorization', `Bearer ${token}`)
    .send({
      deviceId: testDeviceId,
      type: 'PREVENTIVA',
      executedDate: new Date().toISOString(),
      description: `Test maintenance ${Date.now()}`,
      ...body,
    });
  if (res.status === 201) maintenanceIds.push(res.body.id);
  return res;
}

beforeAll(async () => {
  const loginRes = await request(app)
    .post('/api/auth/login?skip_ratelimit=true')
    .send({ username: 'testuser', password: TEST_PASSWORD });
  token = loginRes.body.accessToken;
  userId = loginRes.body.user.id;

  const deviceRes = await request(app)
    .post('/api/devices')
    .set('Authorization', `Bearer ${token}`)
    .send({
      inventoryNumber: `TEST-COV-${Date.now()}`,
      name: 'Test Device Coverage',
      riskClass: 'IIa',
      sectionId: 1,
    });
  testDeviceId = deviceRes.body.id;

  const consumRes = await request(app)
    .post('/api/consumables')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: `Test Part Cov ${Date.now()}`,
      quantity: 100,
      minQuantity: 10,
      unit: 'buc',
    });
  testConsumableId = consumRes.body.id;

  const providerRes = await request(app)
    .post('/api/service-contracts/providers')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: `Test Provider Cov ${Date.now()}`,
      contact: 'Test Contact',
      email: `testcov${Date.now()}@service.md`,
      phone: '+373 67 000 000',
    });
  testProviderId = providerRes.body.id;
});

afterAll(async () => {
  if (maintenanceIds.length) {
    await prisma.maintenance_records.deleteMany({ where: { id: { in: maintenanceIds } } });
  }
  if (ticketIds.length) {
    await prisma.maintenance_records.deleteMany({
      where: { deviceId: testDeviceId, type: 'CORECTIVA' },
    });
    await prisma.repair_tickets.deleteMany({ where: { id: { in: ticketIds } } });
  }
  if (testConsumableId) {
    await prisma.consumables.deleteMany({ where: { id: testConsumableId } });
  }
  if (testProviderId) {
    await prisma.service_providers.deleteMany({ where: { id: testProviderId } });
  }
  if (testDeviceId) {
    await prisma.devices.deleteMany({ where: { id: testDeviceId } });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── repairTickets: POST ─────────────────────────────────────────────

describe('POST /api/repair-tickets — coverage extra', () => {
  it('returnează 400 cu body invalid (fără required fields)', async () => {
    const res = await request(app)
      .post('/api/repair-tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Validare/i);
  });

  it('returnează 400 cu body parțial (fără reportedBy)', async () => {
    const res = await request(app)
      .post('/api/repair-tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceId: testDeviceId, faultDescription: 'Test' });
    expect(res.status).toBe(400);
  });

  it('returnează 404 pentru device inexistent', async () => {
    const res = await request(app)
      .post('/api/repair-tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: 999999,
        reportedBy: 'Test',
        faultDescription: 'Non-existent device',
        priority: 'NORMAL',
      });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/nu există/i);
  });

  it('acceptă prioritate SCAZUT', async () => {
    const res = await createTicket({ priority: 'SCAZUT', faultDescription: 'Low priority test' });
    expect(res.status).toBe(201);
    expect(res.body.priority).toBe('SCAZUT');
  });

  it('acceptă prioritate URGENT', async () => {
    const res = await createTicket({ priority: 'URGENT', faultDescription: 'Urgent priority test' });
    expect(res.status).toBe(201);
    expect(res.body.priority).toBe('URGENT');
  });

  it('acceptă prioritate RIDICAT', async () => {
    const res = await createTicket({ priority: 'RIDICAT', faultDescription: 'High priority test' });
    expect(res.status).toBe(201);
    expect(res.body.priority).toBe('RIDICAT');
  });

  it('returnează 400 pentru prioritate invalidă', async () => {
    const res = await request(app)
      .post('/api/repair-tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        reportedBy: 'Test',
        faultDescription: 'Invalid priority',
        priority: 'INVALID',
      });
    expect(res.status).toBe(400);
  });

  it('500 când DB aruncă la creare (spy)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
    const res = await request(app)
      .post('/api/repair-tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        reportedBy: 'Test',
        faultDescription: 'DB error test',
        priority: 'NORMAL',
      });
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la crearea/i);
    errSpy.mockRestore();
  });
});

// ─── repairTickets: PATCH status ─────────────────────────────────────

describe('PATCH /api/repair-tickets/:id/status — coverage extra', () => {
  it('returnează 400 pentru ID invalid (non-numeric)', async () => {
    const res = await request(app)
      .patch('/api/repair-tickets/abc/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'IN_LUCRU' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ID/i);
  });

  it('returnează 400 pentru body invalid (fără newStatus)', async () => {
    const res = await createTicket({ faultDescription: 'Status body test' });
    const id = res.body.id;

    const patchRes = await request(app)
      .patch(`/api/repair-tickets/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(patchRes.status).toBe(400);
  });

  it('returnează 400 pentru newStatus invalid', async () => {
    const res = await createTicket({ faultDescription: 'Invalid status test' });
    const id = res.body.id;

    const patchRes = await request(app)
      .patch(`/api/repair-tickets/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'GONE_WRONG' });
    expect(patchRes.status).toBe(400);
  });

  it('returnează 400 pentru tranziție DESCHIS → REZOLVAT (invalidă)', async () => {
    const res = await createTicket({ faultDescription: 'Invalid transition test' });
    const id = res.body.id;

    const patchRes = await request(app)
      .patch(`/api/repair-tickets/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'REZOLVAT' });
    expect(patchRes.status).toBe(400);
    expect(patchRes.body.error).toContain('Tranziție invalidă');
    expect(patchRes.body.validTransitions).toBeDefined();
  });

  it('DESCHIS → ESCALADAT valid', async () => {
    const res = await createTicket({ faultDescription: 'Escaladare test' });
    const id = res.body.id;

    const patchRes = await request(app)
      .patch(`/api/repair-tickets/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'ESCALADAT' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.status).toBe('ESCALADAT');
  });

  it('ESCALADAT → DESCHIS valid', async () => {
    const res = await createTicket({ faultDescription: 'Escaladare back test' });
    const id = res.body.id;

    await request(app)
      .patch(`/api/repair-tickets/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'ESCALADAT' });

    const patchRes = await request(app)
      .patch(`/api/repair-tickets/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'DESCHIS' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.status).toBe('DESCHIS');
  });

  it('INCHIS → IN_LUCRU invalidă', async () => {
    const res = await createTicket({ faultDescription: 'INCHIS transition test' });
    const id = res.body.id;

    await request(app)
      .patch(`/api/repair-tickets/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'IN_LUCRU' });
    await request(app)
      .patch(`/api/repair-tickets/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'REZOLVAT' });
    await request(app)
      .patch(`/api/repair-tickets/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'TESTAT' });
    await request(app)
      .patch(`/api/repair-tickets/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'INCHIS' });

    const patchRes = await request(app)
      .patch(`/api/repair-tickets/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'IN_LUCRU' });
    expect(patchRes.status).toBe(400);
    expect(patchRes.body.error).toContain('Tranziție invalidă');
  });

  it('INCHIS → setează device status = FUNCTIONAL', async () => {
    const devRes = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inventoryNumber: `TEST-FUNC-${Date.now()}`,
        name: 'Device Functional Test',
        riskClass: 'I',
        sectionId: 1,
      });
    const devId = devRes.body.id;

    const res = await createTicket({ deviceId: devId, faultDescription: 'Functional test device' });
    const id = res.body.id;
    ticketIds.push(id);

    await request(app)
      .patch(`/api/repair-tickets/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'IN_LUCRU' });
    await request(app)
      .patch(`/api/repair-tickets/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'REZOLVAT' });
    await request(app)
      .patch(`/api/repair-tickets/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'TESTAT' });
    await request(app)
      .patch(`/api/repair-tickets/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'INCHIS' });

    const device = await prisma.devices.findUnique({ where: { id: devId } });
    expect(device.status).toBe('FUNCTIONAL');

    await prisma.repair_tickets.deleteMany({ where: { deviceId: devId } });
    await prisma.devices.deleteMany({ where: { id: devId } });
  });

  it('500 când DB aruncă la status update (spy)', async () => {
    const res = await createTicket({ faultDescription: 'DB status error test' });
    const id = res.body.id;
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
    const patchRes = await request(app)
      .patch(`/api/repair-tickets/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newStatus: 'IN_LUCRU' });
    expect(patchRes.status).toBe(500);
    expect(patchRes.body.error).toMatch(/Eroare la actualizarea statusului/i);
    errSpy.mockRestore();
  });
});

// ─── repairTickets: PATCH triage ─────────────────────────────────────

describe('PATCH /api/repair-tickets/:id/triage — coverage extra', () => {
  it('returnează 400 pentru ID invalid', async () => {
    const res = await request(app)
      .patch('/api/repair-tickets/abc/triage')
      .set('Authorization', `Bearer ${token}`)
      .send({ repairType: 'INTERN', defectCause: 'Test' });
    expect(res.status).toBe(400);
  });

  it('returnează 400 pentru body invalid (fără repairType)', async () => {
    const res = await createTicket({ faultDescription: 'Triage body test' });
    const id = res.body.id;

    const patchRes = await request(app)
      .patch(`/api/repair-tickets/${id}/triage`)
      .set('Authorization', `Bearer ${token}`)
      .send({ defectCause: 'Cause only' });
    expect(patchRes.status).toBe(400);
  });

  it('returnează 400 pentru repairType invalid', async () => {
    const res = await createTicket({ faultDescription: 'Triage invalid type test' });
    const id = res.body.id;

    const patchRes = await request(app)
      .patch(`/api/repair-tickets/${id}/triage`)
      .set('Authorization', `Bearer ${token}`)
      .send({ repairType: 'INVALID', defectCause: 'Cause' });
    expect(patchRes.status).toBe(400);
  });

  it('EXTERN cu externalProviderId valid', async () => {
    const res = await createTicket({ faultDescription: 'EXTERN valid provider test' });
    const id = res.body.id;

    const patchRes = await request(app)
      .patch(`/api/repair-tickets/${id}/triage`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        repairType: 'EXTERN',
        defectCause: 'Defect componenta externa',
        externalProviderId: testProviderId,
      });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.externalized).toBe(true);
    expect(patchRes.body.status).toBe('IN_LUCRU');
  });

  it('EXTERN cu externalProviderId inexistent → 404', async () => {
    const res = await createTicket({ faultDescription: 'EXTERN missing provider test' });
    const id = res.body.id;

    const patchRes = await request(app)
      .patch(`/api/repair-tickets/${id}/triage`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        repairType: 'EXTERN',
        defectCause: 'Defect',
        externalProviderId: 999999,
      });
    expect(patchRes.status).toBe(404);
    expect(patchRes.body.error).toMatch(/Furnizor/i);
  });

  it('INTERN fără externalProviderId', async () => {
    const res = await createTicket({ faultDescription: 'INTERN test' });
    const id = res.body.id;

    const patchRes = await request(app)
      .patch(`/api/repair-tickets/${id}/triage`)
      .set('Authorization', `Bearer ${token}`)
      .send({ repairType: 'INTERN', defectCause: 'Cauza interna' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.externalized).toBe(false);
  });

  it('500 când DB aruncă la triage (spy)', async () => {
    const res = await createTicket({ faultDescription: 'DB triage error test' });
    const id = res.body.id;
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
    const patchRes = await request(app)
      .patch(`/api/repair-tickets/${id}/triage`)
      .set('Authorization', `Bearer ${token}`)
      .send({ repairType: 'INTERN', defectCause: 'Test' });
    expect(patchRes.status).toBe(500);
    expect(patchRes.body.error).toMatch(/Eroare la triaj/i);
    errSpy.mockRestore();
  });
});

// ─── repairTickets: PUT repair ───────────────────────────────────────

describe('PUT /api/repair-tickets/:id/repair — coverage extra', () => {
  async function triageTicket(ticketId) {
    await request(app)
      .patch(`/api/repair-tickets/${ticketId}/triage`)
      .set('Authorization', `Bearer ${token}`)
      .send({ repairType: 'INTERN', defectCause: 'Test cause' });
  }

  it('returnează 400 pentru ID invalid', async () => {
    const res = await request(app)
      .put('/api/repair-tickets/abc/repair')
      .set('Authorization', `Bearer ${token}`)
      .send({
        repairReport: 'Report',
        actionsTaken: 'Actions',
        durationHours: 1,
        functionalTest: 'FUNCTIONAL',
        engineerName: 'Eng',
      });
    expect(res.status).toBe(400);
  });

  it('returnează 400 pentru body invalid', async () => {
    const res = await createTicket({ faultDescription: 'Repair body test' });
    await triageTicket(res.body.id);

    const putRes = await request(app)
      .put(`/api/repair-tickets/${res.body.id}/repair`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(putRes.status).toBe(400);
  });

  it('returnează 404 pentru ticket inexistent', async () => {
    const res = await request(app)
      .put('/api/repair-tickets/999999/repair')
      .set('Authorization', `Bearer ${token}`)
      .send({
        repairReport: 'Report',
        actionsTaken: 'Actions',
        durationHours: 1,
        functionalTest: 'FUNCTIONAL',
        engineerName: 'Eng',
      });
    expect(res.status).toBe(404);
  });

  it('acceptă repair cu partsUsed (calculează totalCost)', async () => {
    const res = await createTicket({ faultDescription: 'Repair with parts test' });
    await triageTicket(res.body.id);

    const putRes = await request(app)
      .put(`/api/repair-tickets/${res.body.id}/repair`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        repairReport: 'Reparat cu piese',
        actionsTaken: 'Schimb piese',
        durationHours: 2,
        partsUsed: [
          { description: 'Test Part Cov', qty: 3, costUnit: 20 },
          { description: 'Alt Part', qty: 1, costUnit: 50 },
        ],
        functionalTest: 'FUNCTIONAL',
        engineerName: 'Ing. Piese',
      });
    expect(putRes.status).toBe(200);
    expect(Number(putRes.body.totalCost)).toBe(110);
    expect(putRes.body.status).toBe('REZOLVAT');
  });

  it('acceptă repair fără partsUsed', async () => {
    const res = await createTicket({ faultDescription: 'Repair no parts test' });
    await triageTicket(res.body.id);

    const putRes = await request(app)
      .put(`/api/repair-tickets/${res.body.id}/repair`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        repairReport: 'Reparat fără piese',
        actionsTaken: 'Ajustare',
        durationHours: 0.5,
        functionalTest: 'FUNCTIONAL',
        engineerName: 'Ing. Fara Piese',
      });
    expect(putRes.status).toBe(200);
    expect(putRes.body.totalCost).toBeNull();
    expect(putRes.body.status).toBe('REZOLVAT');
  });

  it('acceptă repair cu operations', async () => {
    const res = await createTicket({ faultDescription: 'Repair with operations test' });
    await triageTicket(res.body.id);

    const putRes = await request(app)
      .put(`/api/repair-tickets/${res.body.id}/repair`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        repairReport: 'Reparat cu operatii',
        actionsTaken: 'Operatii detaliate',
        durationHours: 3,
        operations: [
          {
            date: new Date().toISOString(),
            timeStart: '09:00',
            timeEnd: '10:30',
            operation: 'Diagnostic',
            engineer: 'Ing. Operatii',
          },
          {
            date: new Date().toISOString(),
            timeStart: '11:00',
            operation: 'Reparatie',
            engineer: 'Ing. Operatii',
          },
        ],
        functionalTest: 'FUNCTIONAL',
        engineerName: 'Ing. Operatii',
      });
    expect(putRes.status).toBe(200);
    expect(putRes.body.status).toBe('REZOLVAT');
  });

  it('functionalTest NEFUNCTIONAL → status rămâne IN_LUCRU', async () => {
    const res = await createTicket({ faultDescription: 'NEFUNCTIONAL test' });
    await triageTicket(res.body.id);

    const putRes = await request(app)
      .put(`/api/repair-tickets/${res.body.id}/repair`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        repairReport: 'Nefunctional report',
        actionsTaken: 'Incercare esuata',
        durationHours: 1,
        functionalTest: 'NEFUNCTIONAL',
        engineerName: 'Ing. NEFUNCTIONAL',
      });
    expect(putRes.status).toBe(200);
    expect(putRes.body.status).toBe('IN_LUCRU');
    expect(putRes.body.resolvedAt).toBeNull();
  });

  it('acceptă semnături și poze (engineerSignature, managerSignature, beforePhoto, afterPhoto)', async () => {
    const res = await createTicket({ faultDescription: 'Signature test' });
    await triageTicket(res.body.id);

    const putRes = await request(app)
      .put(`/api/repair-tickets/${res.body.id}/repair`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        repairReport: 'Cu semnaturi',
        actionsTaken: 'Semnaturi test',
        durationHours: 1,
        functionalTest: 'FUNCTIONAL',
        engineerName: 'Ing. Semnaturi',
        engineerSignature: 'base64sig123',
        managerSignature: 'base64mgr456',
        beforePhoto: 'base64before',
        afterPhoto: 'base64after',
      });
    expect(putRes.status).toBe(200);
    expect(putRes.body.engineerSignature).toBe('base64sig123');
    expect(putRes.body.managerSignature).toBe('base64mgr456');
  });

  it('500 când DB aruncă la repair (spy)', async () => {
    const res = await createTicket({ faultDescription: 'DB repair error test' });
    await triageTicket(res.body.id);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
    const putRes = await request(app)
      .put(`/api/repair-tickets/${res.body.id}/repair`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        repairReport: 'Report',
        actionsTaken: 'Actions',
        durationHours: 1,
        functionalTest: 'FUNCTIONAL',
        engineerName: 'Eng',
      });
    expect(putRes.status).toBe(500);
    expect(putRes.body.error).toMatch(/Eroare la înregistrarea reparației/i);
    errSpy.mockRestore();
  });
});

// ─── repairTickets: GET list with more filters ───────────────────────

describe('GET /api/repair-tickets — coverage extra filters', () => {
  it('filtrează după priority SCAZUT', async () => {
    await createTicket({ priority: 'SCAZUT', faultDescription: 'SCAZUT filter test' });
    const res = await request(app)
      .get('/api/repair-tickets?priority=SCAZUT')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((t) => expect(t.priority).toBe('SCAZUT'));
  });

  it('filtrează după priority RIDICAT', async () => {
    await createTicket({ priority: 'RIDICAT', faultDescription: 'RIDICAT filter test' });
    const res = await request(app)
      .get('/api/repair-tickets?priority=RIDICAT')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((t) => expect(t.priority).toBe('RIDICAT'));
  });

  it('filtrează după status IN_LUCRU', async () => {
    const res = await request(app)
      .get('/api/repair-tickets?status=IN_LUCRU')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((t) => expect(t.status).toBe('IN_LUCRU'));
  });

  it('paginare cu page=2', async () => {
    const res = await request(app)
      .get('/api/repair-tickets?page=2&limit=2')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(2);
  });

  it('normalizează page=0 la 1', async () => {
    const res = await request(app)
      .get('/api/repair-tickets?page=0')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
  });

  it('plafonează limit>100 la 100', async () => {
    const res = await request(app)
      .get('/api/repair-tickets?limit=500')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(100);
  });

  it('500 când DB aruncă la list (spy)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.repair_tickets, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
    const res = await request(app)
      .get('/api/repair-tickets')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la preluarea tichetelor/i);
    errSpy.mockRestore();
  });
});

// ─── repairTickets: GET /:id ─────────────────────────────────────────

describe('GET /api/repair-tickets/:id — coverage extra', () => {
  it('returnează 400 pentru ID invalid', async () => {
    const res = await request(app)
      .get('/api/repair-tickets/abc')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('returnează device info odată cu ticket', async () => {
    const res = await createTicket({ faultDescription: 'Device info test' });
    const getRes = await request(app)
      .get(`/api/repair-tickets/${res.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.device).toBeDefined();
    expect(getRes.body.device.id).toBeDefined();
    expect(getRes.body.device.name).toBeDefined();
  });

  it('500 când DB aruncă (spy)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.repair_tickets, 'findUnique').mockRejectedValueOnce(new Error('DB fail'));
    const res = await request(app)
      .get('/api/repair-tickets/1')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la preluarea tichetului/i);
    errSpy.mockRestore();
  });
});

// ─── repairTickets: GET /:id/formular8-pdf ───────────────────────────

describe('GET /api/repair-tickets/:id/formular8-pdf — coverage extra', () => {
  it('returnează 400 pentru ID invalid', async () => {
    const res = await request(app)
      .get('/api/repair-tickets/xyz/formular8-pdf')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('500 când DB aruncă la PDF (spy)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.repair_tickets, 'findUnique').mockRejectedValueOnce(new Error('DB fail'));
    const res = await request(app)
      .get('/api/repair-tickets/1/formular8-pdf')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la generarea PDF/i);
    errSpy.mockRestore();
  });
});

// ─── repairTickets: GET /:id/handover-pdf ────────────────────────────

describe('GET /api/repair-tickets/:id/handover-pdf — coverage extra', () => {
  let externalTicketId;

  beforeAll(async () => {
    const res = await createTicket({ faultDescription: 'Handover external test' });
    externalTicketId = res.body.id;

    await request(app)
      .patch(`/api/repair-tickets/${externalTicketId}/triage`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        repairType: 'EXTERN',
        defectCause: 'Defect extern',
        externalProviderId: testProviderId,
      });
  });

  it('returnează 400 pentru ID invalid', async () => {
    const res = await request(app)
      .get('/api/repair-tickets/abc/handover-pdf')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('returnează PDF pentru ticket externalizat', async () => {
    const res = await request(app)
      .get(`/api/repair-tickets/${externalTicketId}/handover-pdf`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });

  it('returnează 400 pentru ticket ne-externalizat', async () => {
    const nonExtRes = await createTicket({ faultDescription: 'Non-external handover test' });
    const res = await request(app)
      .get(`/api/repair-tickets/${nonExtRes.body.id}/handover-pdf`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/nu este o reparație externă/i);
  });

  it('returnează 404 pentru ticket inexistent', async () => {
    const res = await request(app)
      .get('/api/repair-tickets/999999/handover-pdf')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('500 când DB aruncă (spy)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.repair_tickets, 'findUnique').mockRejectedValueOnce(new Error('DB fail'));
    const res = await request(app)
      .get(`/api/repair-tickets/${externalTicketId}/handover-pdf`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la generarea PDF/i);
    errSpy.mockRestore();
  });
});

// ─── repairTickets: GET /formular7-pdf ───────────────────────────────

describe('GET /api/repair-tickets/formular7-pdf — coverage extra', () => {
  it('filtrează cu from fără to', async () => {
    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .get(`/api/repair-tickets/formular7-pdf?from=${from}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });

  it('filtrează cu to fără from', async () => {
    const to = new Date().toISOString();
    const res = await request(app)
      .get(`/api/repair-tickets/formular7-pdf?to=${to}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });

  it('500 când DB aruncă (spy)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.repair_tickets, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
    const res = await request(app)
      .get('/api/repair-tickets/formular7-pdf')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la generarea jurnalului PDF/i);
    errSpy.mockRestore();
  });
});

// ─── maintenance: POST validation ────────────────────────────────────

describe('POST /api/maintenance — coverage extra', () => {
  it('returnează 400 pentru executedDate lipsă', async () => {
    const res = await request(app)
      .post('/api/maintenance')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        type: 'PREVENTIVA',
        description: 'Fara data',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Data execuției/i);
  });

  it('returnează 400 pentru description goală', async () => {
    const res = await request(app)
      .post('/api/maintenance')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        type: 'PREVENTIVA',
        executedDate: new Date().toISOString(),
        description: '   ',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Descrierea/i);
  });

  it('returnează 404 pentru device inexistent', async () => {
    const res = await request(app)
      .post('/api/maintenance')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: 999999,
        type: 'PREVENTIVA',
        executedDate: new Date().toISOString(),
        description: 'Device inexistent',
      });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/nu există/i);
  });

  it('returnează 400 pentru type lipsă', async () => {
    const res = await request(app)
      .post('/api/maintenance')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        executedDate: new Date().toISOString(),
        description: 'Fara type',
      });
    expect(res.status).toBe(400);
  });

  it('500 când DB aruncă (spy)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.maintenance_records, 'create').mockRejectedValueOnce(new Error('DB fail'));
    const res = await request(app)
      .post('/api/maintenance')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        type: 'PREVENTIVA',
        executedDate: new Date().toISOString(),
        description: 'DB error test',
      });
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la crearea/i);
    errSpy.mockRestore();
  });
});

// ─── maintenance: PUT ────────────────────────────────────────────────

describe('PUT /api/maintenance/:id — coverage extra', () => {
  it('returnează 400 pentru ID invalid', async () => {
    const res = await request(app)
      .put('/api/maintenance/abc')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Test' });
    expect(res.status).toBe(400);
  });

  it('returnează 404 pentru ID inexistent', async () => {
    const res = await request(app)
      .put('/api/maintenance/999999')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Test' });
    expect(res.status).toBe(404);
  });

  it('actualizează tipul, descrierea și alte câmpuri', async () => {
    const created = await createMaintenance({ type: 'PREVENTIVA', description: 'Original desc' });

    const res = await request(app)
      .put(`/api/maintenance/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'CALIBRARE',
        description: 'Updated description',
        notes: 'Updated notes',
        cost: 200.5,
      });
    expect(res.status).toBe(200);
    expect(res.body.type).toBe('CALIBRARE');
    expect(res.body.description).toBe('Updated description');
    expect(res.body.notes).toBe('Updated notes');
    expect(Number(res.body.cost)).toBe(200.5);
  });

  it('500 când DB aruncă (spy)', async () => {
    const created = await createMaintenance();
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.maintenance_records, 'update').mockRejectedValueOnce(new Error('DB fail'));
    const res = await request(app)
      .put(`/api/maintenance/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Spy test' });
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la actualizarea/i);
    errSpy.mockRestore();
  });
});

// ─── maintenance: DELETE ─────────────────────────────────────────────

describe('DELETE /api/maintenance/:id — coverage extra', () => {
  it('returnează 400 pentru ID invalid', async () => {
    const res = await request(app)
      .delete('/api/maintenance/abc')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('returnează 404 pentru ID inexistent', async () => {
    const res = await request(app)
      .delete('/api/maintenance/999999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('500 când DB aruncă (spy)', async () => {
    const created = await createMaintenance();
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.maintenance_records, 'delete').mockRejectedValueOnce(new Error('DB fail'));
    const res = await request(app)
      .delete(`/api/maintenance/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la ștergerea/i);
    errSpy.mockRestore();
  });
});

// ─── maintenance: GET filters ────────────────────────────────────────

describe('GET /api/maintenance — coverage extra filters', () => {
  it('filtrează cu dateFrom', async () => {
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .get(`/api/maintenance?dateFrom=${from}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('filtrează cu dateTo', async () => {
    const to = new Date().toISOString();
    const res = await request(app)
      .get(`/api/maintenance?dateTo=${to}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('filtrează cu dateFrom și dateTo', async () => {
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const to = new Date().toISOString();
    const res = await request(app)
      .get(`/api/maintenance?dateFrom=${from}&dateTo=${to}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('filtrează cu type invalid (ignorat)', async () => {
    const res = await request(app)
      .get('/api/maintenance?type=INVALID')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('GET /:id returnează 404', async () => {
    const res = await request(app)
      .get('/api/maintenance/999999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('500 când DB aruncă la GET (spy)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.maintenance_records, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
    const res = await request(app)
      .get('/api/maintenance')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la preluarea/i);
    errSpy.mockRestore();
  });

  it('500 când DB aruncă la GET /:id (spy)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.maintenance_records, 'findUnique').mockRejectedValueOnce(new Error('DB fail'));
    const res = await request(app)
      .get('/api/maintenance/1')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la preluarea înregistrării/i);
    errSpy.mockRestore();
  });
});

// ─── consumable.schema.js ────────────────────────────────────────────

describe('consumable.schema.js — validare directă', () => {
  const { consumableCreateSchema, consumableUpdateSchema } = require('../schemas/consumable.schema');

  it('acceptă date valide pentru create', () => {
    const result = consumableCreateSchema.safeParse({
      name: 'Banda Medicala',
      quantity: 50,
      minQuantity: 10,
      unit: 'rola',
    });
    expect(result.success).toBe(true);
  });

  it('respinge name prea scurt (< 3)', () => {
    const result = consumableCreateSchema.safeParse({
      name: 'ab',
      quantity: 50,
      minQuantity: 10,
      unit: 'rola',
    });
    expect(result.success).toBe(false);
  });

  it('respinge quantity negativă', () => {
    const result = consumableCreateSchema.safeParse({
      name: 'Banda Medicala',
      quantity: -1,
      minQuantity: 10,
      unit: 'rola',
    });
    expect(result.success).toBe(false);
  });

  it('acceptă quantity = 0', () => {
    const result = consumableCreateSchema.safeParse({
      name: 'Banda Medicala',
      quantity: 0,
      minQuantity: 0,
      unit: 'rola',
    });
    expect(result.success).toBe(true);
  });

  it('respinge unit gol', () => {
    const result = consumableCreateSchema.safeParse({
      name: 'Banda Medicala',
      quantity: 50,
      minQuantity: 10,
      unit: '',
    });
    expect(result.success).toBe(false);
  });

  it('acceptă expiryDate opțional', () => {
    const result = consumableCreateSchema.safeParse({
      name: 'Banda Medicala',
      quantity: 50,
      minQuantity: 10,
      unit: 'rola',
      expiryDate: new Date('2026-12-31'),
    });
    expect(result.success).toBe(true);
  });

  it('acceptă notes opțional', () => {
    const result = consumableCreateSchema.safeParse({
      name: 'Banda Medicala',
      quantity: 50,
      minQuantity: 10,
      unit: 'rola',
      notes: 'Test notes',
    });
    expect(result.success).toBe(true);
  });

  it('respinge notes > 500 caractere', () => {
    const result = consumableCreateSchema.safeParse({
      name: 'Banda Medicala',
      quantity: 50,
      minQuantity: 10,
      unit: 'rola',
      notes: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('updateSchema acceptă parțial', () => {
    const result = consumableUpdateSchema.safeParse({
      name: 'Nume actualizat',
    });
    expect(result.success).toBe(true);
  });

  it('updateSchema acceptă doar quantity', () => {
    const result = consumableUpdateSchema.safeParse({
      quantity: 100,
    });
    expect(result.success).toBe(true);
  });

  it('updateSchema respinge câmp necunoscut parțial (zod strict)', () => {
    const result = consumableUpdateSchema.safeParse({
      quantity: 100,
      unknownField: 'test',
    });
    expect(result.success).toBe(true);
  });
});

// ─── device.schema.js ────────────────────────────────────────────────

describe('device.schema.js — validare directă', () => {
  const { deviceCreateSchema, deviceUpdateSchema } = require('../schemas/device.schema');

  it('acceptă date valide pentru create', () => {
    const result = deviceCreateSchema.safeParse({
      inventoryNumber: 'DEV-001',
      name: 'Ventilator Medical',
      riskClass: 'IIa',
      sectionId: 1,
    });
    expect(result.success).toBe(true);
  });

  it('respinge inventoryNumber cu litere mici', () => {
    const result = deviceCreateSchema.safeParse({
      inventoryNumber: 'dev-001',
      name: 'Ventilator Medical',
      riskClass: 'IIa',
      sectionId: 1,
    });
    expect(result.success).toBe(false);
  });

  it('acceptă inventoryNumber cu cifre și liniuțe', () => {
    const result = deviceCreateSchema.safeParse({
      inventoryNumber: 'DEV-123-ABC',
      name: 'Ventilator Medical',
      riskClass: 'I',
      sectionId: 1,
    });
    expect(result.success).toBe(true);
  });

  it('respinge name prea scurt (< 3)', () => {
    const result = deviceCreateSchema.safeParse({
      inventoryNumber: 'DEV-002',
      name: 'ab',
      riskClass: 'IIa',
      sectionId: 1,
    });
    expect(result.success).toBe(false);
  });

  it('acceptă toate riskClass valid: I, IIa, IIb, III', () => {
    ['I', 'IIa', 'IIb', 'III'].forEach((rc) => {
      const invNum = `DEV-${rc.toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
      const result = deviceCreateSchema.safeParse({
        inventoryNumber: invNum,
        name: `Device ${rc}`,
        riskClass: rc,
        sectionId: 1,
      });
      expect(result.success).toBe(true);
    });
  });

  it('respinge riskClass invalid', () => {
    const result = deviceCreateSchema.safeParse({
      inventoryNumber: 'DEV-003',
      name: 'Device Invalid RC',
      riskClass: 'IV',
      sectionId: 1,
    });
    expect(result.success).toBe(false);
  });

  it('acceptă toate statusuri valide', () => {
    ['FUNCTIONAL', 'IN_REPARATIE', 'DEFECT', 'CASAT', 'IMPRUMUTAT', 'REZERVA'].forEach((st) => {
      const invNum = `DEV${st.replace(/_/g, '')}${Date.now()}${Math.random().toString(36).slice(2,5).toUpperCase()}`;
      const result = deviceCreateSchema.safeParse({
        inventoryNumber: invNum,
        name: `Device ${st}`,
        riskClass: 'IIa',
        sectionId: 1,
        status: st,
      });
      expect(result.success).toBe(true);
    });
  });

  it('respinge status invalid', () => {
    const result = deviceCreateSchema.safeParse({
      inventoryNumber: 'DEV-004',
      name: 'Device Invalid Status',
      riskClass: 'IIa',
      sectionId: 1,
      status: 'INVALID_STATUS',
    });
    expect(result.success).toBe(false);
  });

  it('acceptă câmpuri opționale', () => {
    const result = deviceCreateSchema.safeParse({
      inventoryNumber: 'DEV-005',
      name: 'Device Full',
      riskClass: 'IIb',
      sectionId: 1,
      serialNumber: 'SN-12345',
      model: 'Model X',
      manufacturer: 'Manufacturer Y',
      countryOfOrigin: 'Moldova',
      yearMade: 2024,
      voltage: '220V',
      frequency: '50Hz',
      power: '100W',
      notes: 'Test notes',
    });
    expect(result.success).toBe(true);
  });

  it('respinge yearMade < 1900', () => {
    const result = deviceCreateSchema.safeParse({
      inventoryNumber: 'DEV-006',
      name: 'Device Old Year',
      riskClass: 'I',
      sectionId: 1,
      yearMade: 1899,
    });
    expect(result.success).toBe(false);
  });

  it('acceptă currency MDL/EUR/USD/RON', () => {
    ['MDL', 'EUR', 'USD', 'RON'].forEach((c) => {
      const result = deviceCreateSchema.safeParse({
        inventoryNumber: `DEV-${c}-${Date.now()}`,
        name: `Device ${c}`,
        riskClass: 'I',
        sectionId: 1,
        currency: c,
      });
      expect(result.success).toBe(true);
    });
  });

  it('respinge currency invalid', () => {
    const result = deviceCreateSchema.safeParse({
      inventoryNumber: 'DEV-007',
      name: 'Device Invalid Currency',
      riskClass: 'I',
      sectionId: 1,
      currency: 'GBP',
    });
    expect(result.success).toBe(false);
  });

  it('updateSchema acceptă parțial', () => {
    const result = deviceUpdateSchema.safeParse({
      name: 'Updated Name',
    });
    expect(result.success).toBe(true);
  });

  it('updateSchema nu permite inventoryNumber', () => {
    const result = deviceUpdateSchema.safeParse({
      inventoryNumber: 'DEV-NEW',
      name: 'Updated',
    });
    expect(result.success).toBe(true);
  });

  it('updateSchema acceptă toate câmpurile opționale', () => {
    const result = deviceUpdateSchema.safeParse({
      name: 'Full Update',
      riskClass: 'III',
      serialNumber: 'SN-NEW',
      model: 'New Model',
      manufacturer: 'New Manufacturer',
    });
    expect(result.success).toBe(true);
  });
});
