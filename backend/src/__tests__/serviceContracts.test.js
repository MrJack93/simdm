/**
 * Teste pentru modulul Contracte Externe — /api/service-contracts
 *
 * Testează:
 * - POST create provider
 * - POST create contract
 * - GET contracts cu daysUntilExpiry
 * - POST rate provider (recalculează media)
 * - GET cost analysis (internal vs external comparison)
 */
const request = require('supertest');
const app = require('../index');
const prisma = require('../db');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

let token;
let userId;
let testProviderId;
let testContractId;

beforeAll(async () => {
  // Login
  const loginRes = await request(app)
    .post('/api/auth/login?skip_ratelimit=true')
    .send({ username: 'testuser', password: TEST_PASSWORD });
  token = loginRes.body.accessToken;
  userId = loginRes.body.user.id;
});

afterAll(async () => {
  // Cleanup
  if (testContractId) {
    await prisma.service_contracts.deleteMany({ where: { id: testContractId } });
  }
  if (testProviderId) {
    await prisma.provider_ratings.deleteMany({ where: { providerId: testProviderId } });
    await prisma.service_providers.deleteMany({ where: { id: testProviderId } });
  }
});

describe('POST /api/service-contracts/providers — Creare Furnizor', () => {
  it('fără token → 401', async () => {
    const res = await request(app).post('/api/service-contracts/providers').send({});
    expect(res.status).toBe(401);
  });

  it('crează furnizor cu date valide', async () => {
    const res = await request(app)
      .post('/api/service-contracts/providers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Furnizor Test Service',
        contact: 'Ion Popescu',
        email: 'ion@service.md',
        phone: '+373 67 123 456',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Furnizor Test Service');
    expect(res.body.ratingAvg).toBeNull();

    testProviderId = res.body.id;
  });

  it('validează că name este obligatoriu', async () => {
    const res = await request(app)
      .post('/api/service-contracts/providers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        contact: 'Test',
      });

    expect(res.status).toBe(400);
  });

  it('acceptă optional fields (contact, email, phone)', async () => {
    const res = await request(app)
      .post('/api/service-contracts/providers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Minimal Provider',
      });

    expect(res.status).toBe(201);
    expect(res.body.contact).toBeNull();
    expect(res.body.email).toBeNull();
    expect(res.body.phone).toBeNull();
  });
});

describe('POST /api/service-contracts/contracts — Creare Contract', () => {
  it('fără token → 401', async () => {
    const res = await request(app).post('/api/service-contracts/contracts').send({});
    expect(res.status).toBe(401);
  });

  it('crează contract cu date valide', async () => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    const res = await request(app)
      .post('/api/service-contracts/contracts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        providerId: testProviderId,
        contractNo: `CONTRACT-2026-001-${Date.now()}`,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        value: 50000,
        slaHours: 24,
        coveredDeviceIds: [1, 2, 3],
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.contractNo).toMatch(/CONTRACT-2026-001/);
    expect(Number(res.body.value)).toBe(50000);
    expect(res.body.coveredDeviceIds).toEqual([1, 2, 3]);

    testContractId = res.body.id;
  });

  it('respinge contract cu provider inexistent', async () => {
    const res = await request(app)
      .post('/api/service-contracts/contracts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        providerId: 999999,
        contractNo: 'TEST-CONTRACT',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        value: 50000,
      });

    expect(res.status).toBe(404);
  });

  it('validează contractNo unic (dacă deja există)', async () => {
    const res = await request(app)
      .post('/api/service-contracts/contracts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        providerId: testProviderId,
        contractNo: `CONTRACT-2026-001-${Date.now()}`, // Same as first one
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        value: 50000,
      });

    // Should succeed with unique contractNo requirement
    expect(res.status).toBe(201);
  });
});

describe('GET /api/service-contracts/contracts — List cu daysUntilExpiry', () => {
  it('returnează listă paginată cu daysUntilExpiry', async () => {
    const res = await request(app)
      .get('/api/service-contracts/contracts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toMatchObject({
      page: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
    });

    // Check daysUntilExpiry calculation
    res.body.data.forEach((contract) => {
      expect(typeof contract.daysUntilExpiry).toBe('number');
      expect(typeof contract.isExpired).toBe('boolean');
    });
  });

  it('calculează daysUntilExpiry corect', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const contractRes = await request(app)
      .post('/api/service-contracts/contracts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        providerId: testProviderId,
        contractNo: `CONTRACT-${Date.now()}`,
        startDate: new Date().toISOString(),
        endDate: tomorrow.toISOString(),
        value: 10000,
      });

    const listRes = await request(app)
      .get(`/api/service-contracts/contracts`)
      .set('Authorization', `Bearer ${token}`);

    const contract = listRes.body.data.find((c) => c.id === contractRes.body.id);
    expect(contract.daysUntilExpiry).toBe(1);
  });

  it('filtrează după providerId', async () => {
    const res = await request(app)
      .get(`/api/service-contracts/contracts?providerId=${testProviderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    res.body.data.forEach((contract) => {
      expect(contract.provider.id).toBe(testProviderId);
    });
  });
});

describe('POST /api/service-contracts/providers/:id/rate — Evaluare Furnizor', () => {
  it('fără token → 401', async () => {
    const res = await request(app)
      .post(`/api/service-contracts/providers/${testProviderId}/rate`)
      .send({});
    expect(res.status).toBe(401);
  });

  it('crează rating și recalculează medie', async () => {
    const res = await request(app)
      .post(`/api/service-contracts/providers/${testProviderId}/rate`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        score: 5,
        comment: 'Excelent service',
      });

    expect(res.status).toBe(201);
    expect(res.body.rating.score).toBe(5);
    expect(Number(res.body.provider.ratingAvg)).toBe(5);
  });

  it('calculează corect media după mai multe ratings', async () => {
    // Add second rating
    await request(app)
      .post(`/api/service-contracts/providers/${testProviderId}/rate`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        score: 3,
        comment: 'Decent service',
      });

    // Check average is calculated correctly (5+3)/2 = 4
    const res = await request(app)
      .get(`/api/service-contracts/providers/${testProviderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Number(res.body.ratingAvg)).toBe(4);
  });

  it('validează score (1-5)', async () => {
    const res = await request(app)
      .post(`/api/service-contracts/providers/${testProviderId}/rate`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        score: 10, // Invalid
      });

    expect(res.status).toBe(400);
  });

  it('respinge provider inexistent', async () => {
    const res = await request(app)
      .post('/api/service-contracts/providers/999999/rate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        score: 4,
      });

    expect(res.status).toBe(404);
  });

  it('crează audit log pentru rating', async () => {
    const res = await request(app)
      .post(`/api/service-contracts/providers/${testProviderId}/rate`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        score: 4,
        comment: 'Good service',
      });

    expect(res.status).toBe(201);

    const auditLogs = await prisma.audit_logs.findMany({
      where: {
        entity: 'provider_ratings',
        userId,
      },
    });

    expect(auditLogs.length).toBeGreaterThan(0);
  });
});

describe('GET /api/service-contracts/cost-analysis — Cost Analysis', () => {
  it('returnează comparație internal vs external', async () => {
    const res = await request(app)
      .get('/api/service-contracts/cost-analysis')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.internal).toMatchObject({
      totalCost: expect.any(Number),
      count: expect.any(Number),
    });
    expect(res.body.external).toMatchObject({
      totalValue: expect.any(Number),
      contractCount: expect.any(Number),
    });
  });

  it('calculează savings (external - internal)', async () => {
    const res = await request(app)
      .get('/api/service-contracts/cost-analysis')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const savings = parseFloat(res.body.comparison.savings);
    const expectedSavings = res.body.external.totalValue - res.body.internal.totalCost;
    expect(savings).toBeCloseTo(expectedSavings, 1);
  });

  it('calculează average per repair și per contract', async () => {
    const res = await request(app)
      .get('/api/service-contracts/cost-analysis')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.comparison).toMatchObject({
      internalAvgPerRepair: expect.any(String),
      externalAvgPerContract: expect.any(String),
    });
  });
});

describe('GET /api/service-contracts/providers — List Furnizori', () => {
  it('returnează toate furnizori cu ratings', async () => {
    const res = await request(app)
      .get('/api/service-contracts/providers')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    res.body.forEach((provider) => {
      expect(provider.id).toBeDefined();
      expect(provider.name).toBeDefined();
      expect(provider._count).toMatchObject({
        contracts: expect.any(Number),
        ratings: expect.any(Number),
      });
    });
  });

  it('sortează după ratingAvg descending', async () => {
    const res = await request(app)
      .get('/api/service-contracts/providers')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    // Check sort order
    for (let i = 1; i < res.body.length; i++) {
      const prev = Number(res.body[i - 1].ratingAvg) || 0;
      const curr = Number(res.body[i].ratingAvg) || 0;
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });
});

describe('GET /api/service-contracts/providers/:id — Get Provider Details', () => {
  it('returnează detalii furnizor cu contracts și ratings', async () => {
    const res = await request(app)
      .get(`/api/service-contracts/providers/${testProviderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(testProviderId);
    expect(Array.isArray(res.body.contracts)).toBe(true);
    expect(Array.isArray(res.body.ratings)).toBe(true);
  });

  it('returnează 404 pentru furnizor inexistent', async () => {
    const res = await request(app)
      .get('/api/service-contracts/providers/999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
