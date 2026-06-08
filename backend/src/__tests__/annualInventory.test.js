/**
 * Teste pentru modulul Inventariere Anuală — /api/annual-inventory
 *
 * Toate rutele necesită autentificare. Endpoint-uri reale:
 *   GET  /api/annual-inventory/years
 *   GET  /api/annual-inventory/:year/status
 *   POST /api/annual-inventory/:year/section/:sectionId   (checklist items)
 *   GET  /api/annual-inventory/:year/discrepancies
 *   POST /api/annual-inventory/:year/discrepancies/:id/verify
 *   GET  /api/annual-inventory/:year/report-pdf
 *
 * Logica de discrepanță: un item cu found=false este o discrepanță.
 * Când toate item-urile sunt found=true, inventarul devine COMPLETED.
 *
 * Curățenie: device-ul și inventarul create în teste sunt șterse în afterAll
 * (cascade pe items prin onDelete: Cascade).
 */
const request = require('supertest');
const app = require('../index');
const prisma = require('../db');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';
const YEAR = 2099; // an de test, izolat de date reale

// Cod unic pentru o secție DEDICATĂ acestui fișier. Izolarea e esențială:
// numărul de item-uri de inventariere depinde de câte device-uri non-CASAT
// există în secție. Dacă am folosi secția TEST partajată, testele paralele
// din devices.test.js ar adăuga device-uri și ar strica numărătoarea.
const SECTION_CODE = 'TEST-AI';

let token;
let sectionId;
let deviceId;

beforeAll(async () => {
  const loginRes = await request(app)
    .post('/api/auth/login?skip_ratelimit=true')
    .send({ username: 'testuser', password: TEST_PASSWORD });
  token = loginRes.body.accessToken;

  // Secție izolată, doar pentru acest fișier de test
  const section = await prisma.sections.upsert({
    where: { code: SECTION_CODE },
    update: { isActive: true },
    create: {
      name: 'Secție Test Inventariere',
      code: SECTION_CODE,
      floor: 'P',
      isActive: true,
      updatedAt: new Date(),
    },
  });
  sectionId = section.id;

  // Curăță orice device rămas în secția izolată dintr-o rulare anterioară
  // (incidents înainte de devices — FK constraint incidents_deviceId_fkey)
  await prisma.incidents.deleteMany({ where: { devices: { sectionId } } });
  await prisma.devices.deleteMany({ where: { sectionId } });

  // Un singur device în secția izolată -> exact un item de inventariat
  const device = await prisma.devices.create({
    data: {
      inventoryNumber: `INVAN-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: 'Aparat inventariere test',
      status: 'FUNCTIONAL',
      sectionId,
      updatedAt: new Date(),
    },
  });
  deviceId = device.id;
});

afterAll(async () => {
  // Șterge inventarele anului de test (cascade pe items), apoi device + secția
  await prisma.annual_inventories.deleteMany({ where: { year: YEAR, sectionId } });
  await prisma.audit_logs.deleteMany({ where: { entity: 'Device', entityId: String(deviceId) } });
  await prisma.incidents.deleteMany({ where: { deviceId } });
  await prisma.devices.deleteMany({ where: { id: deviceId } });
  await prisma.sections.deleteMany({ where: { code: SECTION_CODE } });
});

describe('Autorizare /api/annual-inventory', () => {
  it('GET /years fără token -> 401 NO_TOKEN', async () => {
    const res = await request(app).get('/api/annual-inventory/years');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('NO_TOKEN');
  });
});

describe('GET /api/annual-inventory/years', () => {
  it('returnează un array de ani (anul curent + 5 anteriori)', async () => {
    const res = await request(app)
      .get('/api/annual-inventory/years')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(6);
    expect(res.body[0]).toBe(new Date().getFullYear());
  });
});

describe('GET /api/annual-inventory/:year/status', () => {
  it('returnează status per secție (NOT_STARTED inițial)', async () => {
    const res = await request(app)
      .get(`/api/annual-inventory/${YEAR}/status`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const testSection = res.body.find((s) => s.sectionId === sectionId);
    expect(testSection).toBeDefined();
    expect(testSection.status).toBe('NOT_STARTED');
    expect(testSection).toHaveProperty('totalCount');
    expect(testSection).toHaveProperty('foundCount');
    expect(testSection).toHaveProperty('percentage');
  });

  it('respinge un an invalid -> 400', async () => {
    const res = await request(app)
      .get('/api/annual-inventory/1500/status')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid/i);
  });
});

describe('POST /api/annual-inventory/:year/section/:sectionId — checklist', () => {
  it('creează inventarul și marchează device-ul drept găsit', async () => {
    const res = await request(app)
      .post(`/api/annual-inventory/${YEAR}/section/${sectionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ deviceId, found: true, locationFound: 'Cameră 1' }] });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    const item = res.body.items.find((i) => i.deviceId === deviceId);
    expect(item).toBeDefined();
    expect(item.found).toBe(true);
    expect(item.locationFound).toBe('Cameră 1');
  });

  it('marchează inventarul COMPLETED când toate item-urile sunt found', async () => {
    // după testul anterior, singurul device este found=true
    const inventory = await prisma.annual_inventories.findFirst({
      where: { year: YEAR, sectionId },
      include: { items: true },
    });
    expect(inventory).not.toBeNull();
    const allFound = inventory.items.every((i) => i.found);
    if (allFound) {
      expect(inventory.status).toBe('COMPLETED');
      expect(inventory.completedAt).not.toBeNull();
    }
  });

  it('respinge parametri invalizi -> 400', async () => {
    const res = await request(app)
      .post(`/api/annual-inventory/0/section/0`)
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalizi/i);
  });
});

describe('GET /api/annual-inventory/:year/discrepancies + verify', () => {
  it('calculează discrepanțele (item-urile found=false) și permite verificarea', async () => {
    // Resetează inventarul anului de test: marchează device-ul ca negăsit
    let inventory = await prisma.annual_inventories.findFirst({
      where: { year: YEAR, sectionId },
      include: { items: true },
    });
    if (!inventory) {
      // creează dacă lipsește
      await request(app)
        .post(`/api/annual-inventory/${YEAR}/section/${sectionId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ deviceId, found: false }] });
      inventory = await prisma.annual_inventories.findFirst({
        where: { year: YEAR, sectionId },
        include: { items: true },
      });
    }
    await prisma.inventory_check_items.updateMany({
      where: { inventoryId: inventory.id },
      data: { found: false, status: 'PENDING_VERIFICATION' },
    });

    const disc = await request(app)
      .get(`/api/annual-inventory/${YEAR}/discrepancies`)
      .set('Authorization', `Bearer ${token}`);
    expect(disc.status).toBe(200);
    expect(Array.isArray(disc.body)).toBe(true);
    const ourItem = disc.body.find((d) => d.deviceId === deviceId);
    expect(ourItem).toBeDefined();
    expect(ourItem.found).toBe(false);

    // Verifică (marchează VERIFIED) discrepanța
    const verifyRes = await request(app)
      .post(`/api/annual-inventory/${YEAR}/discrepancies/${ourItem.id}/verify`)
      .set('Authorization', `Bearer ${token}`);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.status).toBe('VERIFIED');
  });

  it('respinge un an invalid la discrepancies -> 400', async () => {
    const res = await request(app)
      .get('/api/annual-inventory/abc/discrepancies')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/annual-inventory/:year/report-pdf', () => {
  it('generează un raport PDF -> content-type pdf, status 200', async () => {
    const res = await request(app)
      .get(`/api/annual-inventory/${YEAR}/report-pdf`)
      .set('Authorization', `Bearer ${token}`)
      .buffer(true);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.headers['content-disposition']).toMatch(/Raport_Inventariere_/);
  });
});

describe('POST /api/annual-inventory/import-fixed-assets — import Excel', () => {
  const XLSX = require('xlsx');
  const importedCndCodes = [];

  // Construiește un buffer .xlsx cu coloanele așteptate de endpoint
  function buildXlsx(rows) {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MijloaceFixe');
    return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  }

  afterAll(async () => {
    if (importedCndCodes.length) {
      await prisma.devices.deleteMany({ where: { cndCode: { in: importedCndCodes } } });
    }
  });

  it('respinge cererea fără fișier -> 400', async () => {
    const res = await request(app)
      .post('/api/annual-inventory/import-fixed-assets')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Niciun fișier/i);
  });

  it('respinge un MIME non-Excel (multer fileFilter)', async () => {
    const res = await request(app)
      .post('/api/annual-inventory/import-fixed-assets')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('text simplu'), {
        filename: 'date.txt',
        contentType: 'text/plain',
      });
    expect([400, 500]).toContain(res.status);
  });

  it('importă rânduri valide și creează device-uri noi', async () => {
    const cnd = `CND-IMP-${Date.now()}`;
    importedCndCodes.push(cnd);
    const buffer = buildXlsx([
      { Cod: cnd, Denumire: 'Aparat importat', Valoare: 1500 },
      { Cod: '', Denumire: 'Fără cod — ignorat' }, // rând fără câmpuri cheie -> skip
    ]);

    const res = await request(app)
      .post('/api/annual-inventory/import-fixed-assets')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', buffer, {
        filename: 'mijloace.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Import completat/i);
    expect(res.body.createdCount).toBeGreaterThanOrEqual(1);

    const created = await prisma.devices.findFirst({ where: { cndCode: cnd } });
    expect(created).not.toBeNull();
    expect(created.name).toBe('Aparat importat');
  });

  it('actualizează un device existent cu același cod CND', async () => {
    const cnd = `CND-UPD-${Date.now()}`;
    importedCndCodes.push(cnd);
    // creează în prealabil un device cu acest cnd
    await prisma.devices.create({
      data: {
        inventoryNumber: `EXIST-${Date.now()}`,
        name: 'Existent',
        cndCode: cnd,
        status: 'FUNCTIONAL',
        sectionId,
        updatedAt: new Date(),
      },
    });

    const buffer = buildXlsx([{ Cod: cnd, Denumire: 'Existent', Valoare: 9999 }]);
    const res = await request(app)
      .post('/api/annual-inventory/import-fixed-assets')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', buffer, {
        filename: 'update.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

    expect(res.status).toBe(200);
    expect(res.body.updatedCount).toBeGreaterThanOrEqual(1);

    const updated = await prisma.devices.findFirst({ where: { cndCode: cnd } });
    expect(Number(updated.acquisitionValue)).toBe(9999);
  });
});
