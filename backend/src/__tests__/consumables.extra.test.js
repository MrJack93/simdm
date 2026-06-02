/**
 * Teste suplimentare /api/consumables — validări de margine și căi de eroare:
 *   PUT    /:id   -> 400 ID invalid (non-numeric)
 *   PUT    /:id   -> 400 nume gol explicit
 *   DELETE /:id   -> 400 ID invalid (non-numeric)
 *   GET    /      -> 500 când DB aruncă (spy)
 *   POST   /      -> 500 când create aruncă (spy)
 *   logAudit       -> nu propagă eroarea când audit_logs.create eșuează
 *
 * Boundary paginare: page=0/negativ se normalizează la 1; limit>100 se
 * plafonează la 100.
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
    .send({ name: `Extra-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, quantity: 10, ...body });
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
  vi.restoreAllMocks();
  if (createdIds.length) {
    const ids = createdIds.splice(0);
    await prisma.consumables.deleteMany({ where: { id: { in: ids } } });
  }
});

describe('GET /api/consumables — boundary paginare', () => {
  it('normalizează page=0 la 1 și plafonează limit>100 la 100', async () => {
    const res = await request(app)
      .get('/api/consumables?page=0&limit=500')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(100);
  });

  it('acceptă page negativ și îl normalizează la 1', async () => {
    const res = await request(app)
      .get('/api/consumables?page=-5')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
  });

  it('returnează listă goală pentru o pagină mult peste total (offset mare)', async () => {
    const res = await request(app)
      .get('/api/consumables?page=99999&limit=10')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.consumables).toEqual([]);
  });
});

describe('PUT /api/consumables/:id — validări de margine', () => {
  it('respinge un ID non-numeric -> 400 ID invalid', async () => {
    const res = await request(app)
      .put('/api/consumables/abc')
      .set('Authorization', `Bearer ${token}`)
      .send({ minQuantity: 5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ID consumabil invalid/i);
  });

  it('respinge nume gol explicit la update -> 400', async () => {
    const created = await createConsumable();
    const res = await request(app)
      .put(`/api/consumables/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/obligatorie/i);
  });
});

describe('DELETE /api/consumables/:id — validări de margine', () => {
  it('respinge un ID non-numeric -> 400 ID invalid', async () => {
    const res = await request(app)
      .delete('/api/consumables/xyz')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ID consumabil invalid/i);
  });
});

describe('/api/consumables — căi de eroare DB (spy)', () => {
  it('GET -> 500 când Promise.all de interogări aruncă', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.consumables, 'findMany').mockRejectedValueOnce(new Error('DB read fail'));
    const res = await request(app)
      .get('/api/consumables')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la preluarea/i);
    errSpy.mockRestore();
  });

  it('POST -> 500 când create aruncă', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.consumables, 'create').mockRejectedValueOnce(new Error('DB write fail'));
    const res = await request(app)
      .post('/api/consumables')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `ErrCreate-${Date.now()}`, quantity: 1 });
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la crearea/i);
    errSpy.mockRestore();
  });

  it('logAudit nu rupe fluxul când audit_logs.create eșuează (POST tot 201)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.audit_logs, 'create').mockRejectedValueOnce(new Error('audit fail'));

    const res = await request(app)
      .post('/api/consumables')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `AuditFail-${Date.now()}`, quantity: 2 });

    // create-ul consumabilului reușește chiar dacă logAudit eșuează intern
    expect(res.status).toBe(201);
    if (res.status === 201) createdIds.push(res.body.id);
    errSpy.mockRestore();
  });

  it('PUT -> 500 când update aruncă', async () => {
    const created = await createConsumable();
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.consumables, 'update').mockRejectedValueOnce(new Error('DB update fail'));
    const res = await request(app)
      .put(`/api/consumables/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ minQuantity: 7 });
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la actualizarea/i);
    errSpy.mockRestore();
  });

  it('DELETE -> 500 când update (soft delete) aruncă', async () => {
    const created = await createConsumable();
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.consumables, 'update').mockRejectedValueOnce(new Error('DB delete fail'));
    const res = await request(app)
      .delete(`/api/consumables/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la ștergerea/i);
    errSpy.mockRestore();
  });

  it('GET /dropdown -> 500 când findMany aruncă', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.consumables, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
    const res = await request(app)
      .get('/api/consumables/dropdown')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la preluarea/i);
    errSpy.mockRestore();
  });
});
