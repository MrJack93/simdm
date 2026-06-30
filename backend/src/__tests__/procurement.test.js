const request = require('supertest');
const app = require('../index');
const prisma = require('../db');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';
let token;
const createdPlanIds = [];
const createdItemIds = [];

beforeAll(async () => {
  const loginRes = await request(app)
    .post('/api/auth/login?skip_ratelimit=true')
    .send({ username: 'testuser', password: TEST_PASSWORD });
  token = loginRes.body.accessToken;
});

afterEach(async () => {
  if (createdItemIds.length) {
    const ids = createdItemIds.splice(0);
    await prisma.procurement_items.deleteMany({ where: { id: { in: ids } } });
  }
  if (createdPlanIds.length) {
    const ids = createdPlanIds.splice(0);
    await prisma.procurement_plans.deleteMany({ where: { id: { in: ids } } });
  }
});

afterAll(async () => { await prisma.$disconnect(); });

describe('POST /api/procurement/plans', () => {
  it('creează plan + audit ne-null', async () => {
    const res = await request(app)
      .post('/api/procurement/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ year: 2026, type: 'DM', elaboratedBy: 'Test Bioinginer' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('DRAFT');
    expect(res.body.year).toBe(2026);
    createdPlanIds.push(res.body.id);

    const audit = await prisma.audit_logs.findFirst({
      where: { entity: 'ProcurementPlan', entityId: String(res.body.id), action: 'CREATE' },
      orderBy: { timestamp: 'desc' },
    });
    expect(audit).toBeTruthy();
    expect(audit.userId).toBeTruthy();
  });

  it('date invalide -> 400', async () => {
    const res = await request(app)
      .post('/api/procurement/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ year: 'bad', type: 'INVALID' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/procurement/plans/:id/items', () => {
  it('adaugă item + recalculează totalul', async () => {
    const planRes = await request(app)
      .post('/api/procurement/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ year: 2027, type: 'DM' });
    const planId = planRes.body.id;
    createdPlanIds.push(planId);

    const res = await request(app)
      .post(`/api/procurement/plans/${planId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Monitor Test', quantity: 2, unitPrice: 5000 });
    expect(res.status).toBe(201);
    expect(Number(res.body.totalPrice)).toBe(10000);
    createdItemIds.push(res.body.id);

    const plan = await prisma.procurement_plans.findUnique({ where: { id: planId } });
    expect(Number(plan.totalAmount)).toBe(10000);
  });

  it('plan COORDONAT -> 400 (nu mai poți adăuga)', async () => {
    const planRes = await request(app)
      .post('/api/procurement/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ year: 2028, type: 'CONSUMABIL' });
    const planId = planRes.body.id;
    createdPlanIds.push(planId);

    await request(app).patch(`/api/procurement/plans/${planId}/status`).set('Authorization', `Bearer ${token}`).send({ newStatus: 'COORDONAT' });

    const res = await request(app)
      .post(`/api/procurement/plans/${planId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test', quantity: 1 });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/procurement/plans/:id/status', () => {
  it('tranziție DRAFT -> COORDONAT -> APROBAT', async () => {
    const planRes = await request(app)
      .post('/api/procurement/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ year: 2029, type: 'DM' });
    const planId = planRes.body.id;
    createdPlanIds.push(planId);

    const r1 = await request(app).patch(`/api/procurement/plans/${planId}/status`).set('Authorization', `Bearer ${token}`).send({ newStatus: 'COORDONAT', coordSection: 'Șef Secție' });
    expect(r1.status).toBe(200);
    expect(r1.body.status).toBe('COORDONAT');

    const r2 = await request(app).patch(`/api/procurement/plans/${planId}/status`).set('Authorization', `Bearer ${token}`).send({ newStatus: 'APROBAT', coordSibm: 'Șef D/SIBM' });
    expect(r2.status).toBe(200);
    expect(r2.body.status).toBe('APROBAT');
    expect(r2.body.approvedAt).toBeTruthy();
  });

  it('tranziție invalidă -> 400', async () => {
    const planRes = await request(app)
      .post('/api/procurement/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ year: 2030, type: 'DM' });
    const planId = planRes.body.id;
    createdPlanIds.push(planId);

    const res = await request(app).patch(`/api/procurement/plans/${planId}/status`).set('Authorization', `Bearer ${token}`).send({ newStatus: 'APROBAT' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/procurement/plans', () => {
  it('returnează structura paginată', async () => {
    const res = await request(app).get('/api/procurement/plans').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/procurement/plans/:id/pdf', () => {
  it('returnează PDF 200 (DM)', async () => {
    const planRes = await request(app)
      .post('/api/procurement/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ year: 2031, type: 'DM' });
    const planId = planRes.body.id;
    createdPlanIds.push(planId);

    const res = await request(app).get(`/api/procurement/plans/${planId}/pdf`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });

  it('returnează PDF 200 (CONSUMABIL)', async () => {
    const planRes = await request(app)
      .post('/api/procurement/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ year: 2032, type: 'CONSUMABIL' });
    const planId = planRes.body.id;
    createdPlanIds.push(planId);

    const res = await request(app).get(`/api/procurement/plans/${planId}/pdf`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });
});

describe('DELETE /api/procurement/items/:id', () => {
  it('șterge item + recalculează totalAmount', async () => {
    const planRes = await request(app)
      .post('/api/procurement/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ year: 2033, type: 'DM' });
    const planId = planRes.body.id;
    createdPlanIds.push(planId);

    const item1 = await request(app).post(`/api/procurement/plans/${planId}/items`).set('Authorization', `Bearer ${token}`).send({ name: 'Item A', quantity: 1, unitPrice: 5000 });
    const item2 = await request(app).post(`/api/procurement/plans/${planId}/items`).set('Authorization', `Bearer ${token}`).send({ name: 'Item B', quantity: 2, unitPrice: 3000 });

    let plan = await prisma.procurement_plans.findUnique({ where: { id: planId } });
    expect(Number(plan.totalAmount)).toBe(11000);

    await request(app).delete(`/api/procurement/items/${item1.body.id}`).set('Authorization', `Bearer ${token}`);

    plan = await prisma.procurement_plans.findUnique({ where: { id: planId } });
    expect(Number(plan.totalAmount)).toBe(6000);
  });
});
