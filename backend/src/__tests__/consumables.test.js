/**
 * Teste pentru modulul Consumabile — /api/consumables
 *
 * Toate rutele necesită autentificare. Soft-delete setează isDeleted=true
 * (consumabilul rămâne în DB dar e exclus din liste/dropdown).
 *
 * Endpoint-uri:
 *   GET    /api/consumables            (paginare + search + minQuantity)
 *   GET    /api/consumables/dropdown
 *   POST   /api/consumables            (validare nume + cantitate)
 *   PUT    /api/consumables/:id
 *   DELETE /api/consumables/:id        (soft delete)
 */
const request = require('supertest');
const app = require('../index');
const prisma = require('../db');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

let token;
const createdIds = [];

async function createConsumable(body = {}) {
  const res = await request(app)
    .post('/api/consumables')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: `Mănuși-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, quantity: 100, minQuantity: 10, ...body });
  if (res.status === 201) createdIds.push(res.body.id);
  return res;
}

beforeAll(async () => {
  const loginRes = await request(app)
    .post('/api/auth/login?skip_ratelimit=true')
    .send({ username: 'testuser', password: TEST_PASSWORD });
  token = loginRes.body.accessToken;
});

afterEach(async () => {
  if (createdIds.length) {
    const ids = createdIds.splice(0);
    await prisma.consumables.deleteMany({ where: { id: { in: ids } } });
  }
});

describe('Autorizare /api/consumables', () => {
  it('GET fără token -> 401 NO_TOKEN', async () => {
    const res = await request(app).get('/api/consumables');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('NO_TOKEN');
  });
});

describe('GET /api/consumables — listă', () => {
  it('returnează structura paginată { consumables, pagination }', async () => {
    const res = await request(app)
      .get('/api/consumables')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.consumables)).toBe(true);
    expect(res.body.pagination).toMatchObject({
      page: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
      pages: expect.any(Number),
    });
  });

  it('găsește consumabilul prin search după nume', async () => {
    const marker = `Seringă-${Date.now()}`;
    await createConsumable({ name: marker });
    const res = await request(app)
      .get(`/api/consumables?search=${encodeURIComponent(marker)}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.consumables.some((c) => c.name === marker)).toBe(true);
  });

  it('filtrează stocul scăzut cu minQuantity (alertă stoc)', async () => {
    const low = `StocMic-${Date.now()}`;
    await createConsumable({ name: low, quantity: 3 });
    const res = await request(app)
      .get('/api/consumables?minQuantity=5')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    // toate rezultatele au quantity < 5
    expect(res.body.consumables.every((c) => c.quantity < 5)).toBe(true);
    expect(res.body.consumables.some((c) => c.name === low)).toBe(true);
  });
});

describe('GET /api/consumables/dropdown', () => {
  it('returnează array cu id, name și unitOfMeasure', async () => {
    await createConsumable({ name: `Drop-${Date.now()}`, unitOfMeasure: 'cutie' });
    const res = await request(app)
      .get('/api/consumables/dropdown')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('name');
    expect(res.body[0]).toHaveProperty('unitOfMeasure');
  });
});

describe('POST /api/consumables — creare', () => {
  it('creează un consumabil valid -> 201', async () => {
    const res = await createConsumable({ name: `Comprese-${Date.now()}`, quantity: 50, minQuantity: 5 });
    expect(res.status).toBe(201);
    expect(typeof res.body.id).toBe('number');
    expect(res.body.quantity).toBe(50);
    expect(res.body.minQuantity).toBe(5);
    expect(res.body.isDeleted).toBe(false);
  });

  it('respinge nume gol -> 400 cu mesaj în română', async () => {
    const res = await request(app)
      .post('/api/consumables')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '   ', quantity: 10 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/obligatorie/i);
  });

  it('respinge cantitate negativă -> 400', async () => {
    const res = await request(app)
      .post('/api/consumables')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Neg-${Date.now()}`, quantity: -5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/negativ/i);
  });

  it('aplică unitOfMeasure implicit "buc"', async () => {
    const res = await createConsumable({ name: `Default-${Date.now()}` });
    expect(res.status).toBe(201);
    expect(res.body.unitOfMeasure).toBe('buc');
  });
});

describe('PUT /api/consumables/:id — actualizare', () => {
  it('actualizează minQuantity (prag alertă stoc)', async () => {
    const created = await createConsumable({ name: `Upd-${Date.now()}`, minQuantity: 5 });
    const res = await request(app)
      .put(`/api/consumables/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ minQuantity: 25 });
    expect(res.status).toBe(200);
    expect(res.body.minQuantity).toBe(25);
  });

  it('returnează 404 pentru un consumabil inexistent', async () => {
    const res = await request(app)
      .put('/api/consumables/99999999')
      .set('Authorization', `Bearer ${token}`)
      .send({ minQuantity: 5 });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/nu găsit/i);
  });

  it('respinge cantitate negativă la update -> 400', async () => {
    const created = await createConsumable({ name: `UpdNeg-${Date.now()}` });
    const res = await request(app)
      .put(`/api/consumables/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: -1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/negativ/i);
  });
});

describe('DELETE /api/consumables/:id — soft delete', () => {
  it('marchează consumabilul ca isDeleted și îl exclude din listă', async () => {
    const created = await createConsumable({ name: `Del-${Date.now()}` });
    const id = created.body.id;

    const res = await request(app)
      .delete(`/api/consumables/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/șters cu succes/i);
    expect(res.body.consumable.isDeleted).toBe(true);

    // rămâne în DB
    const inDb = await prisma.consumables.findUnique({ where: { id } });
    expect(inDb).not.toBeNull();
    expect(inDb.isDeleted).toBe(true);

    // exclus din listă
    const list = await request(app)
      .get('/api/consumables')
      .set('Authorization', `Bearer ${token}`);
    expect(list.body.consumables.some((c) => c.id === id)).toBe(false);
  });

  it('returnează 404 la ștergerea unui consumabil inexistent', async () => {
    const res = await request(app)
      .delete('/api/consumables/99999999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
