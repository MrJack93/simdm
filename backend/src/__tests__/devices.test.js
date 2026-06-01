/**
 * Teste pentru modulul Inventar DM — /api/devices
 *
 * Toate rutele necesită autentificare (router.use(authMiddleware)).
 * Token-ul este obținut prin /api/auth/login (NU hardcodat) și verificat
 * implicit de fiecare cerere protejată.
 *
 * Endpoint-uri acoperite:
 *   GET    /api/devices                  (paginare + filtre + search)
 *   GET    /api/devices/:id
 *   POST   /api/devices                  (validare zod, duplicat 409)
 *   PUT    /api/devices/:id
 *   DELETE /api/devices/:id              (soft delete -> CASAT)
 *   GET    /api/devices/dropdown/sections
 *   GET    /api/devices/:id/fisa-pdf     (PDF)
 *   GET    /api/devices/export/xlsx      (Excel)
 *   GET    /api/devices/export/csv       (CSV)
 *
 * Curățenie: orice device creat în teste este șters fizic în afterEach.
 */
const request = require('supertest');
const app = require('../index');
const prisma = require('../db');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

let token;
let sectionId;
const createdDeviceIds = [];

// Generează un inventoryNumber unic și valid (doar A-Z, 0-9, -)
function uniqueInv(prefix = 'DEV') {
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${rnd}`;
}

function validDevicePayload(overrides = {}) {
  return {
    inventoryNumber: uniqueInv(),
    name: 'Monitor pacient',
    riskClass: 'IIa',
    sectionId,
    status: 'FUNCTIONAL',
    ...overrides,
  };
}

// Creează un device direct prin API și reține id-ul pentru curățenie
async function createDevice(overrides = {}) {
  const res = await request(app)
    .post('/api/devices')
    .set('Authorization', `Bearer ${token}`)
    .send(validDevicePayload(overrides));
  if (res.status === 201) createdDeviceIds.push(res.body.id);
  return res;
}

beforeAll(async () => {
  const loginRes = await request(app)
    .post('/api/auth/login?skip_ratelimit=true')
    .send({ username: 'testuser', password: TEST_PASSWORD });
  token = loginRes.body.accessToken;

  const section = await prisma.sections.findUnique({ where: { code: 'TEST' } });
  sectionId = section.id;
});

afterEach(async () => {
  if (createdDeviceIds.length) {
    const ids = createdDeviceIds.splice(0);
    await prisma.audit_logs.deleteMany({
      where: { entity: 'Device', entityId: { in: ids.map(String) } },
    });
    await prisma.devices.deleteMany({ where: { id: { in: ids } } });
  }
});

describe('Autorizare /api/devices', () => {
  it('GET /api/devices fără token -> 401 NO_TOKEN', async () => {
    const res = await request(app).get('/api/devices');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('NO_TOKEN');
  });

  it('GET /api/devices cu token invalid -> 403 TOKEN_INVALID', async () => {
    const res = await request(app)
      .get('/api/devices')
      .set('Authorization', 'Bearer token.invalid.xxx');
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('TOKEN_INVALID');
  });
});

describe('GET /api/devices/dropdown/sections', () => {
  it('returnează un array de secții cu id și name', async () => {
    const res = await request(app)
      .get('/api/devices/dropdown/sections')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('name');
  });
});

describe('POST /api/devices — creare', () => {
  it('respinge date invalide (name prea scurt) -> 400 cu fields', async () => {
    const res = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({ inventoryNumber: uniqueInv(), name: 'ab', riskClass: 'IIa', sectionId });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Date invalide/i);
    expect(res.body.fields).toHaveProperty('name');
  });

  it('respinge inventoryNumber cu caractere ilegale -> 400', async () => {
    const res = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({ inventoryNumber: 'inv cu spatii!', name: 'Aparat', riskClass: 'I', sectionId });
    expect(res.status).toBe(400);
    expect(res.body.fields).toHaveProperty('inventoryNumber');
  });

  it('respinge riskClass invalid -> 400', async () => {
    const res = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({ inventoryNumber: uniqueInv(), name: 'Aparat', riskClass: 'X', sectionId });
    expect(res.status).toBe(400);
    expect(res.body.fields).toHaveProperty('riskClass');
  });

  it('creează un device valid -> 201 cu id numeric', async () => {
    const res = await createDevice({ name: 'Defibrilator' });
    expect(res.status).toBe(201);
    expect(typeof res.body.id).toBe('number');
    expect(res.body.name).toBe('Defibrilator');
    expect(res.body.status).toBe('FUNCTIONAL');
    expect(res.body.sections).toHaveProperty('name');
  });

  it('aplică status implicit FUNCTIONAL când nu e furnizat', async () => {
    const res = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({ inventoryNumber: uniqueInv(), name: 'Pompă infuzie', riskClass: 'IIb', sectionId });
    if (res.status === 201) createdDeviceIds.push(res.body.id);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('FUNCTIONAL');
  });

  it('respinge inventoryNumber duplicat -> 409', async () => {
    const inv = uniqueInv();
    const first = await createDevice({ inventoryNumber: inv });
    expect(first.status).toBe(201);

    const dup = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send(validDevicePayload({ inventoryNumber: inv }));
    expect(dup.status).toBe(409);
    expect(dup.body.error).toMatch(/există deja/i);
  });
});

describe('GET /api/devices/:id — detalii', () => {
  it('returnează detaliile unui device existent', async () => {
    const created = await createDevice({ name: 'ECG Holter' });
    const id = created.body.id;

    const res = await request(app)
      .get(`/api/devices/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
    expect(res.body.name).toBe('ECG Holter');
    expect(res.body.sections).toHaveProperty('name');
    // relația este expusă cu numele din schema Prisma (snake_case)
    expect(Array.isArray(res.body.maintenance_records)).toBe(true);
    expect(Array.isArray(res.body.incidents)).toBe(true);
  });

  it('returnează 404 pentru un id inexistent', async () => {
    const res = await request(app)
      .get('/api/devices/99999999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/nu găsit/i);
  });
});

describe('GET /api/devices — listă, paginare, filtre, search', () => {
  it('returnează structura paginată { devices, pagination }', async () => {
    const res = await request(app)
      .get('/api/devices')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.devices)).toBe(true);
    expect(res.body.pagination).toMatchObject({
      page: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
      pages: expect.any(Number),
    });
  });

  it('filtrează după status (DEFECT) și returnează doar acel status', async () => {
    await createDevice({ status: 'DEFECT', name: 'Aparat defect' });
    const res = await request(app)
      .get('/api/devices?status=DEFECT')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.devices.every((d) => d.status === 'DEFECT')).toBe(true);
  });

  it('găsește un device prin search după nume', async () => {
    const marker = `Ventilator-${Date.now()}`;
    await createDevice({ name: marker });
    const res = await request(app)
      .get(`/api/devices?search=${encodeURIComponent(marker)}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.devices.some((d) => d.name === marker)).toBe(true);
  });

  it('exclude implicit device-urile CASAT din listă', async () => {
    const created = await createDevice({ name: 'De casat' });
    await request(app)
      .delete(`/api/devices/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get('/api/devices')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.devices.some((d) => d.id === created.body.id)).toBe(false);
  });
});

describe('PUT /api/devices/:id — actualizare', () => {
  it('actualizează câmpuri și reflectă modificarea', async () => {
    const created = await createDevice({ name: 'Nume vechi', status: 'FUNCTIONAL' });
    const id = created.body.id;

    const res = await request(app)
      .put(`/api/devices/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nume nou', status: 'IN_REPARATIE' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Nume nou');
    expect(res.body.status).toBe('IN_REPARATIE');
  });

  it('returnează 404 la actualizarea unui device inexistent', async () => {
    const res = await request(app)
      .put('/api/devices/99999999')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Orice' });
    expect(res.status).toBe(404);
  });

  it('respinge date invalide la update -> 400', async () => {
    const created = await createDevice();
    const res = await request(app)
      .put(`/api/devices/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'STATUS_INEXISTENT' });
    expect(res.status).toBe(400);
    expect(res.body.fields).toHaveProperty('status');
  });
});

describe('DELETE /api/devices/:id — soft delete', () => {
  it('marchează device-ul drept CASAT (nu îl șterge fizic)', async () => {
    const created = await createDevice({ name: 'De casat soft' });
    const id = created.body.id;

    const res = await request(app)
      .delete(`/api/devices/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/casat cu succes/i);
    expect(res.body.device.status).toBe('CASAT');

    // încă există în DB, dar cu status CASAT și decommissionDate setat
    const inDb = await prisma.devices.findUnique({ where: { id } });
    expect(inDb).not.toBeNull();
    expect(inDb.status).toBe('CASAT');
    expect(inDb.decommissionDate).not.toBeNull();
  });
});

describe('Export & PDF', () => {
  it('GET /api/devices/:id/fisa-pdf -> content-type PDF, status 200', async () => {
    const created = await createDevice({ name: 'Pentru PDF' });
    const res = await request(app)
      .get(`/api/devices/${created.body.id}/fisa-pdf?skip_ratelimit=true`)
      .set('Authorization', `Bearer ${token}`)
      .buffer(true);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.headers['content-disposition']).toMatch(/Fisa_DM_/);
  });

  it('GET /api/devices/:id/fisa-pdf pentru id inexistent -> 404', async () => {
    const res = await request(app)
      .get('/api/devices/99999999/fisa-pdf?skip_ratelimit=true')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('GET /api/devices/export/xlsx -> content-type spreadsheet, status 200', async () => {
    const res = await request(app)
      .get('/api/devices/export/xlsx?skip_ratelimit=true')
      .set('Authorization', `Bearer ${token}`)
      .buffer(true);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/spreadsheetml\.sheet/);
    expect(res.headers['content-disposition']).toMatch(/\.xlsx/);
  });

  it('GET /api/devices/export/csv -> content-type csv, status 200', async () => {
    const res = await request(app)
      .get('/api/devices/export/csv?skip_ratelimit=true')
      .set('Authorization', `Bearer ${token}`)
      .buffer(true);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/\.csv/);
  });
});

describe('POST /api/devices/:id/upload — încărcare fișier (cu antivirus)', () => {
  // PDF minim valid, recunoscut prin magic bytes %PDF-
  const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');

  it('încarcă un PDF valid și setează manualUrl pe device', async () => {
    const created = await createDevice({ name: 'Cu manual' });
    const res = await request(app)
      .post(`/api/devices/${created.body.id}/upload`)
      .set('Authorization', `Bearer ${token}`)
      .field('field', 'manualUrl')
      .attach('file', pdf, 'manual.pdf');

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/încărcat cu succes/i);
    expect(res.body.fileUrl).toMatch(/^\/uploads\/devices\//);
    expect(res.body.device.manualUrl).toBe(res.body.fileUrl);

    // curăță fișierul fizic încărcat
    const fs = require('fs');
    const path = require('path');
    const filename = res.body.fileUrl.split('/').pop();
    const onDisk = path.join(__dirname, '../../uploads/devices', filename);
    if (fs.existsSync(onDisk)) fs.unlinkSync(onDisk);
  });

  it('respinge un tip de fișier neacceptat (multer fileFilter) -> 500', async () => {
    const created = await createDevice({ name: 'Fișier rău' });
    // .exe nu este în lista de MIME-uri permise de multer
    const res = await request(app)
      .post(`/api/devices/${created.body.id}/upload`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('MZ binar'), {
        filename: 'virus.exe',
        contentType: 'application/x-msdownload',
      });
    // fileFilter aruncă -> error handler global -> 500
    expect([400, 500]).toContain(res.status);
  });

  it('respinge cererea fără fișier -> 400', async () => {
    const created = await createDevice({ name: 'Fără fișier' });
    const res = await request(app)
      .post(`/api/devices/${created.body.id}/upload`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Nu s-a găsit fișier/i);
  });
});
