/**
 * Teste pentru modulul Incidente — /api/incidents
 *
 * Toate rutele necesită autentificare. Testează CRUD, severități, statuse,
 * și mai important: verific că reportedById nu e null (H1 fix).
 *
 * Endpoint-uri:
 *   GET    /api/incidents            (paginare + filtre)
 *   GET    /api/incidents/:id
 *   POST   /api/incidents            (create cu deviceId, severity, status)
 *   PUT    /api/incidents/:id
 *   DELETE /api/incidents/:id
 */
const request = require('supertest');
const app = require('../index');
const prisma = require('../db');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

let token;
let userId; // Extract userId from JWT for verification
let testDeviceId;
let testSectionId;
const createdIds = [];

async function createIncident(body = {}) {
  const res = await request(app)
    .post('/api/incidents')
    .set('Authorization', `Bearer ${token}`)
    .send({
      deviceId: testDeviceId,
      occurredAt: new Date().toISOString(),
      description: `Test incident ${Date.now()}`,
      severity: 'MINOR',
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
  userId = loginRes.body.user.id; // Get userId for audit verification

  // Create test device
  const deviceRes = await request(app)
    .post('/api/devices')
    .set('Authorization', `Bearer ${token}`)
    .send({
      inventoryNumber: `TEST-INC-${Date.now()}`,
      name: 'Test Device for Incidents',
      riskClass: 'I',
      sectionId: 1,
    });
  testDeviceId = deviceRes.body.id;

  // Get test section
  const sectionsRes = await request(app)
    .get('/api/devices/dropdown/sections')
    .set('Authorization', `Bearer ${token}`);
  testSectionId = sectionsRes.body[0]?.id || 1;
});

afterEach(async () => {
  if (createdIds.length) {
    const ids = createdIds.splice(0);
    await prisma.incidents.deleteMany({ where: { id: { in: ids } } });
  }
});

afterAll(async () => {
  if (testDeviceId) {
    await prisma.devices.deleteMany({ where: { id: testDeviceId } });
  }
});

describe('Autorizare /api/incidents', () => {
  it('GET fără token -> 401', async () => {
    const res = await request(app).get('/api/incidents');
    expect(res.status).toBe(401);
  });

  it('POST fără token -> 401', async () => {
    const res = await request(app).post('/api/incidents').send({});
    expect(res.status).toBe(401);
  });
});

describe('GET /api/incidents — listă', () => {
  it('returnează structura paginată', async () => {
    const res = await request(app)
      .get('/api/incidents')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toMatchObject({
      page: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
    });
  });

  it('filtrează după severity', async () => {
    await createIncident({ severity: 'GRAV' });
    const res = await request(app)
      .get('/api/incidents?severity=GRAV')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    // Ar trebui să conțină cel puțin incidentul creat cu GRAV
  });

  it('filtrează după status', async () => {
    const res = await request(app)
      .get('/api/incidents?status=DESCHIS')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/incidents/:id', () => {
  it('returnează detaliile incidentului', async () => {
    const created = await createIncident();
    expect(created.status).toBe(201);

    const res = await request(app)
      .get(`/api/incidents/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
  });

  it('returnează 404 pentru incident inexistent', async () => {
    const res = await request(app)
      .get('/api/incidents/999999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/incidents — creare', () => {
  it('crează incident cu reportedById = req.user.sub (H1 fix)', async () => {
    const res = await createIncident({
      severity: 'MINOR',
      description: 'Test incident with reportedById verification',
    });
    expect(res.status).toBe(201);
    expect(res.body.reportedById).toBe(userId); // KEY TEST FOR H1 FIX
    expect(res.body.reportedById).not.toBeNull();
  });

  it('crează incident cu status inițial DESCHIS', async () => {
    const res = await createIncident();
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('DESCHIS');
  });

  it('validează că deviceId este obligatoriu', async () => {
    const res = await request(app)
      .post('/api/incidents')
      .set('Authorization', `Bearer ${token}`)
      .send({
        occurredAt: new Date().toISOString(),
        description: 'No device',
        severity: 'MINOR',
      });
    expect(res.status).toBe(400);
  });

  it('validează că severity este una din valorile acceptate', async () => {
    const res = await request(app)
      .post('/api/incidents')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        occurredAt: new Date().toISOString(),
        description: 'Invalid severity',
        severity: 'INVALID_SEVERITY',
      });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/incidents/:id — update', () => {
  it('actualizează statusul incidentului', async () => {
    const created = await createIncident({ status: 'DESCHIS' });
    expect(created.status).toBe(201);

    const updateRes = await request(app)
      .put(`/api/incidents/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'IN_LUCRU' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe('IN_LUCRU');
  });

  it('actualizează severity-ul', async () => {
    const created = await createIncident({ severity: 'MINOR' });
    const updateRes = await request(app)
      .put(`/api/incidents/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ severity: 'GRAV' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.severity).toBe('GRAV');
  });

  it('validează severity-ul la update', async () => {
    const created = await createIncident();
    const res = await request(app)
      .put(`/api/incidents/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ severity: 'INVALID' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/incidents/:id', () => {
  it('șterge incidentul', async () => {
    const created = await createIncident();
    const deleteRes = await request(app)
      .delete(`/api/incidents/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);

    // Verify it's deleted
    const getRes = await request(app)
      .get(`/api/incidents/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(404);
  });
});

describe('Audit trail para incidente (H1 fix)', () => {
  it('audit_logs conține userId din req.user.sub, nu null', async () => {
    const created = await createIncident({ severity: 'MODERAT' });
    expect(created.status).toBe(201);

    // Verify audit log
    const auditLogs = await prisma.audit_logs.findMany({
      where: {
        entity: 'incidents',
        entityId: String(created.body.id),
      },
    });
    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0].userId).toBe(userId);
    expect(auditLogs[0].userId).not.toBeNull();
  });
});
