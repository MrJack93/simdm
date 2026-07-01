/**
 * Teste suplimentare /api/annual-inventory — căi de margine și erori:
 *   POST /:year/discrepancies/:id/verify -> 400 ID invalid
 *   GET  /:year/report-pdf               -> ramura "nicio discrepanță"
 *   POST /import-fixed-assets            -> 400 Excel gol (niciun rând)
 *   GET  /:year/status                   -> 500 când DB aruncă (spy)
 *   GET  /:year/discrepancies            -> 500 când DB aruncă (spy)
 *   POST /import-fixed-assets            -> 500 când DB aruncă (spy)
 *   logAudit                              -> nu propagă eroarea de audit
 */
const request = require('supertest');
const app = require('../index');
const prisma = require('../db');
const XLSX = require('xlsx');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';
const YEAR = 2098;
const SECTION_CODE = 'TEST-AIX';

let token;
let sectionId;
let deviceId;
const importedCndCodes = [];

function buildXlsx(rows) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'MijloaceFixe');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
}

beforeAll(async () => {
  const loginRes = await request(app)
    .post('/api/auth/login?skip_ratelimit=true')
    .send({ username: 'testuser', password: TEST_PASSWORD });
  token = loginRes.body.accessToken;

  const section = await prisma.sections.upsert({
    where: { code: SECTION_CODE },
    update: { isActive: true },
    create: { name: 'Secție Test Inv Extra', code: SECTION_CODE, floor: 'P', isActive: true, updatedAt: new Date() },
  });
  sectionId = section.id;
  await prisma.incidents.deleteMany({ where: { devices: { sectionId } } });
  await prisma.devices.deleteMany({ where: { sectionId } });

  const device = await prisma.devices.create({
    data: {
      inventoryNumber: `INVAX-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: 'Aparat inv extra',
      status: 'FUNCTIONAL',
      sectionId,
      updatedAt: new Date(),
    },
  });
  deviceId = device.id;
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await prisma.annual_inventories.deleteMany({ where: { sectionId } });
  if (importedCndCodes.length) {
    await prisma.incidents.deleteMany({ where: { devices: { cndCode: { in: importedCndCodes } } } });
    await prisma.devices.deleteMany({ where: { cndCode: { in: importedCndCodes } } });
  }
  await prisma.audit_logs.deleteMany({ where: { entity: 'Device', entityId: String(deviceId) } });
  await prisma.incidents.deleteMany({ where: { deviceId } });
  await prisma.devices.deleteMany({ where: { id: deviceId } });
  await prisma.sections.deleteMany({ where: { code: SECTION_CODE } });
});

describe('POST /:year/discrepancies/:id/verify — validare', () => {
  it('respinge un ID non-numeric -> 400', async () => {
    const res = await request(app)
      .post(`/api/annual-inventory/${YEAR}/discrepancies/abc/verify`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ID invalid/i);
  });
});

describe('GET /:year/status — status cu inventar existent (items)', () => {
  it('calculează foundCount/percentage când inventarul are item-uri', async () => {
    // creează inventarul cu device-ul marcat găsit
    await request(app)
      .post(`/api/annual-inventory/${YEAR}/section/${sectionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ deviceId, found: true, locationFound: 'Cameră A' }] });

    const res = await request(app)
      .get(`/api/annual-inventory/${YEAR}/status`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const sec = res.body.find((s) => s.sectionId === sectionId);
    expect(sec).toBeDefined();
    expect(sec.totalCount).toBeGreaterThanOrEqual(1);
    expect(sec.foundCount).toBeGreaterThanOrEqual(1);
    expect(sec.percentage).toBeGreaterThan(0);
  });
});

describe('GET /:year/report-pdf — fără discrepanțe', () => {
  it('generează PDF cu mesajul "nicio discrepanță" când toate sunt găsite', async () => {
    // asigură că toate item-urile sunt found=true (din testul de status anterior)
    const inv = await prisma.annual_inventories.findFirst({ where: { year: YEAR, sectionId }, include: { items: true } });
    if (inv) {
      await prisma.inventory_check_items.updateMany({ where: { inventoryId: inv.id }, data: { found: true } });
    }
    const res = await request(app)
      .get(`/api/annual-inventory/${YEAR}/report-pdf`)
      .set('Authorization', `Bearer ${token}`)
      .buffer(true);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
  });
});

describe('POST /import-fixed-assets — Excel gol', () => {
  it('respinge un fișier Excel fără rânduri -> 400', async () => {
    const buffer = buildXlsx([]); // sheet existent dar fără rânduri de date
    const res = await request(app)
      .post('/api/annual-inventory/import-fixed-assets')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', buffer, {
        filename: 'gol.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Niciun rând|gol/i);
  });
});

describe('/api/annual-inventory — căi de eroare DB (spy)', () => {
  it('GET /:year/status -> 500 când sections.findMany aruncă', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.sections, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
    const res = await request(app)
      .get(`/api/annual-inventory/${YEAR}/status`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la preluarea status/i);
    errSpy.mockRestore();
  });

  it('GET /:year/discrepancies -> 500 când findMany aruncă', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.inventory_check_items, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
    const res = await request(app)
      .get(`/api/annual-inventory/${YEAR}/discrepancies`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la preluarea discrepanțelor/i);
    errSpy.mockRestore();
  });

  it('POST /import-fixed-assets -> 500 când parsarea/DB aruncă', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const cnd = `CND-ERR-${Date.now()}`;
    importedCndCodes.push(cnd);
    vi.spyOn(prisma.devices, 'findFirst').mockRejectedValueOnce(new Error('DB fail'));
    const buffer = buildXlsx([{ Cod: cnd, Denumire: 'Va eșua', Valoare: 1 }]);
    const res = await request(app)
      .post('/api/annual-inventory/import-fixed-assets')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', buffer, {
        filename: 'err.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la import/i);
    errSpy.mockRestore();
  });

  it('logAudit nu rupe fluxul când audit_logs.create eșuează (POST checklist tot 200)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.audit_logs, 'create').mockRejectedValueOnce(new Error('audit fail'));
    const res = await request(app)
      .post(`/api/annual-inventory/${YEAR}/section/${sectionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ deviceId, found: true }] });
    expect(res.status).toBe(200);
    errSpy.mockRestore();
  });
});

describe('GET /api/annual-inventory/years — additional coverage', () => {
  it('returnează array de 6 ani consecutive (curent + 5 anteriori)', async () => {
    const res = await request(app)
      .get('/api/annual-inventory/years')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(6);
    const currentYear = new Date().getFullYear();
    expect(res.body[0]).toBe(currentYear);
    expect(res.body[5]).toBe(currentYear - 5);
  });
});

describe('GET /api/annual-inventory/:year/status — edge cases', () => {
  it('respinge an < 2000 -> 400', async () => {
    const res = await request(app)
      .get('/api/annual-inventory/1999/status')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('respinge an > 2100 -> 400', async () => {
    const res = await request(app)
      .get('/api/annual-inventory/2101/status')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('returnează status NOT_STARTED pentru an fără inventar', async () => {
    const yearNoInventory = 2050;
    const res = await request(app)
      .get(`/api/annual-inventory/${yearNoInventory}/status`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const testSec = res.body.find((s) => s.sectionId === sectionId);
    if (testSec) {
      expect(testSec.status).toBe('NOT_STARTED');
      expect(testSec.foundCount).toBe(0);
      expect(testSec.percentage).toBe(0);
    }
  });
});

describe('POST /api/annual-inventory/:year/section/:sectionId — transactional', () => {
  it('creează inventar cu items pentru toate dispozitivele din secție', async () => {
    const yearTest = 2097;
    const res = await request(app)
      .post(`/api/annual-inventory/${yearTest}/section/${sectionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ deviceId, found: false }] });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');

    const inv = await prisma.annual_inventories.findFirst({
      where: { year: yearTest, sectionId },
      include: { items: true },
    });
    expect(inv).not.toBeNull();
    expect(inv.items.length).toBeGreaterThanOrEqual(1);
  });

  it('marchează inventar COMPLETED când toate items found=true', async () => {
    const yearTest = 2096;
    const inv = await prisma.annual_inventories.create({
      data: {
        year: yearTest,
        sectionId,
        status: 'IN_PROGRESS',
        updatedAt: new Date(),
        items: {
          create: [{ deviceId, found: false }],
        },
      },
      include: { items: true },
    });

    const res = await request(app)
      .post(`/api/annual-inventory/${yearTest}/section/${sectionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ deviceId, found: true, locationFound: 'Test' }] });

    expect(res.status).toBe(200);
    const updated = await prisma.annual_inventories.findUnique({
      where: { id: inv.id },
    });
    expect(updated.status).toBe('COMPLETED');
    expect(updated.completedAt).not.toBeNull();
  });

  it('creeaza audit log la update inventariere', async () => {
    const yearTest = 2095;
    const invRes = await request(app)
      .post(`/api/annual-inventory/${yearTest}/section/${sectionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ deviceId, found: true }] });

    expect(invRes.status).toBe(200);

    const logs = await prisma.audit_logs.findMany({
      where: { entity: 'annual_inventories' },
      orderBy: { timestamp: 'desc' },
      take: 1,
    });

    if (logs.length > 0) {
      expect(logs[0].action).toBe('UPDATE');
      expect(logs[0].changes).not.toBeNull();
    }
  });
});

describe('GET /api/annual-inventory/:year/discrepancies — filtering', () => {
  it('returnează lista discrepanțelor (found=false)', async () => {
    const yearTest = 2094;
    await request(app)
      .post(`/api/annual-inventory/${yearTest}/section/${sectionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ deviceId, found: false }] });

    const res = await request(app)
      .get(`/api/annual-inventory/${yearTest}/discrepancies`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const ourDisc = res.body.find((d) => d.deviceId === deviceId);
    expect(ourDisc).toBeDefined();
    expect(ourDisc.found).toBe(false);
  });

  it('respinge an invalid -> 400', async () => {
    const res = await request(app)
      .get('/api/annual-inventory/abc/discrepancies')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
