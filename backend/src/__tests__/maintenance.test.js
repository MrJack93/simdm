/**
 * Teste pentru modulul Mentenanță — /api/maintenance
 *
 * Toate rutele necesită autentificare. Testează CRUD, tipuri de mentenanță,
 * și verifică că performedById nu e null (H1 fix).
 *
 * Endpoint-uri:
 *   GET    /api/maintenance            (paginare + filtre)
 *   GET    /api/maintenance/:id
 *   POST   /api/maintenance            (create record)
 *   PUT    /api/maintenance/:id
 *   DELETE /api/maintenance/:id
 */
const request = require('supertest');
const app = require('../index');
const prisma = require('../db');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

let token;
let userId;
let testDeviceId;
const createdIds = [];

async function createMaintenanceRecord(body = {}) {
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
  if (res.status === 201) createdIds.push(res.body.id);
  return res;
}

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
      inventoryNumber: `TEST-MAINT-${Date.now()}`,
      name: 'Test Device for Maintenance',
      riskClass: 'I',
      sectionId: 1,
    });
  testDeviceId = deviceRes.body.id;
});

afterEach(async () => {
  if (createdIds.length) {
    const ids = createdIds.splice(0);
    await prisma.maintenance_records.deleteMany({ where: { id: { in: ids } } });
  }
});

afterAll(async () => {
  if (testDeviceId) {
    await prisma.devices.deleteMany({ where: { id: testDeviceId } });
  }
});

describe('Autorizare /api/maintenance', () => {
  it('GET fără token -> 401', async () => {
    const res = await request(app).get('/api/maintenance');
    expect(res.status).toBe(401);
  });

  it('POST fără token -> 401', async () => {
    const res = await request(app).post('/api/maintenance').send({});
    expect(res.status).toBe(401);
  });
});

describe('GET /api/maintenance — listă', () => {
  it('returnează structura paginată', async () => {
    const res = await request(app)
      .get('/api/maintenance')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toMatchObject({
      page: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
    });
  });

  it('filtrează după type (PREVENTIVA, CORECTIVA, etc)', async () => {
    await createMaintenanceRecord({ type: 'PREVENTIVA' });
    const res = await request(app)
      .get('/api/maintenance?type=PREVENTIVA')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('filtrează după deviceId', async () => {
    await createMaintenanceRecord();
    const res = await request(app)
      .get(`/api/maintenance?deviceId=${testDeviceId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/maintenance/:id', () => {
  it('returnează detaliile înregistrării', async () => {
    const created = await createMaintenanceRecord();
    expect(created.status).toBe(201);

    const res = await request(app)
      .get(`/api/maintenance/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
  });

  it('returnează 404 pentru înregistrare inexistentă', async () => {
    const res = await request(app)
      .get('/api/maintenance/999999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/maintenance — creare', () => {
  it('crează record cu performedById = req.user.sub (H1 fix)', async () => {
    const res = await createMaintenanceRecord({
      type: 'PREVENTIVA',
      description: 'Test maintenance with performedById verification',
    });
    expect(res.status).toBe(201);
    expect(res.body.performedById).toBe(userId); // KEY TEST FOR H1 FIX
    expect(res.body.performedById).not.toBeNull();
  });

  it('validează că deviceId este obligatoriu', async () => {
    const res = await request(app)
      .post('/api/maintenance')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'PREVENTIVA',
        executedDate: new Date().toISOString(),
        description: 'No device',
      });
    expect(res.status).toBe(400);
  });

  it('validează că type este valid', async () => {
    const res = await request(app)
      .post('/api/maintenance')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        type: 'INVALID_TYPE',
        executedDate: new Date().toISOString(),
        description: 'Invalid type',
      });
    expect(res.status).toBe(400);
  });

  it('validează că description este obligatorie', async () => {
    const res = await request(app)
      .post('/api/maintenance')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        type: 'PREVENTIVA',
        executedDate: new Date().toISOString(),
      });
    expect(res.status).toBe(400);
  });

  it('acceptă mentenanță corectivă cu cost', async () => {
    const res = await createMaintenanceRecord({
      type: 'CORECTIVA',
      cost: 150.75,
      partsReplaced: 'Pompa de combustibil',
    });
    expect(res.status).toBe(201);
    expect(res.body.cost).toBe(150.75);
    expect(res.body.partsReplaced).toBe('Pompa de combustibil');
  });

  it('acceptă mentenanță cu furnizor extern', async () => {
    const res = await createMaintenanceRecord({
      type: 'PREVENTIVA',
      externalService: true,
      serviceProvider: 'Service XYZ SRL',
    });
    expect(res.status).toBe(201);
    expect(res.body.externalService).toBe(true);
    expect(res.body.serviceProvider).toBe('Service XYZ SRL');
  });
});

describe('PUT /api/maintenance/:id — update', () => {
  it('actualizează tipul mentenanței', async () => {
    const created = await createMaintenanceRecord({ type: 'PREVENTIVA' });
    const updateRes = await request(app)
      .put(`/api/maintenance/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'CORECTIVA' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.type).toBe('CORECTIVA');
  });

  it('actualizează descrierea', async () => {
    const created = await createMaintenanceRecord();
    const newDesc = `Updated description ${Date.now()}`;
    const updateRes = await request(app)
      .put(`/api/maintenance/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: newDesc });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.description).toBe(newDesc);
  });

  it('validează type la update', async () => {
    const created = await createMaintenanceRecord();
    const res = await request(app)
      .put(`/api/maintenance/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'INVALID' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/maintenance/:id', () => {
  it('șterge înregistrarea de mentenanță', async () => {
    const created = await createMaintenanceRecord();
    const deleteRes = await request(app)
      .delete(`/api/maintenance/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);

    // Verify it's deleted
    const getRes = await request(app)
      .get(`/api/maintenance/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(404);
  });
});

describe('Audit trail pentru mentenanță (H1 fix)', () => {
  it('audit_logs conține userId din req.user.sub, nu null', async () => {
    const created = await createMaintenanceRecord({ type: 'PREVENTIVA' });
    expect(created.status).toBe(201);

    // Verify audit log
    const auditLogs = await prisma.audit_logs.findMany({
      where: {
        entity: 'maintenance_records',
        entityId: String(created.body.id),
      },
    });
    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0].userId).toBe(userId);
    expect(auditLogs[0].userId).not.toBeNull();
  });
});
