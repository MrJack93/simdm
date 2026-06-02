/**
 * Teste suplimentare /api/devices — filtre de export, PDF cu observații,
 * upload cu câmpuri variate și căi de eroare (spy pe Prisma).
 *
 * Acoperă:
 *   - export xlsx/csv cu filtre status + riskClass + sectionId
 *   - fișa PDF pentru un device CU observații (notes)
 *   - upload fără câmp 'field' (default manualUrl) și cu field invalid (fallback)
 *   - GET / -> 500 când findMany aruncă
 *   - POST / -> 500 când create aruncă
 *   - GET /:id/fisa-pdf -> 500 când findUnique aruncă
 */
const request = require('supertest');
const app = require('../index');
const prisma = require('../db');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

let token;
let sectionId;
const createdDeviceIds = [];

function uniqueInv(prefix = 'DEVX') {
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${rnd}`;
}

async function createDevice(overrides = {}) {
  const res = await request(app)
    .post('/api/devices')
    .set('Authorization', `Bearer ${token}`)
    .send({ inventoryNumber: uniqueInv(), name: 'Aparat extra', riskClass: 'IIa', sectionId, status: 'FUNCTIONAL', ...overrides });
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
  vi.restoreAllMocks();
  if (createdDeviceIds.length) {
    const ids = createdDeviceIds.splice(0);
    await prisma.audit_logs.deleteMany({ where: { entity: 'Device', entityId: { in: ids.map(String) } } });
    await prisma.devices.deleteMany({ where: { id: { in: ids } } });
  }
});

describe('Export cu filtre (status + riskClass + sectionId)', () => {
  it('GET /export/xlsx cu toate filtrele -> 200', async () => {
    await createDevice({ status: 'DEFECT', riskClass: 'III' });
    const res = await request(app)
      .get(`/api/devices/export/xlsx?skip_ratelimit=true&status=DEFECT&riskClass=III&sectionId=${sectionId}&search=Aparat`)
      .set('Authorization', `Bearer ${token}`)
      .buffer(true);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/spreadsheetml\.sheet/);
  });

  it('GET /export/csv cu toate filtrele -> 200', async () => {
    await createDevice({ status: 'IN_REPARATIE', riskClass: 'IIb' });
    const res = await request(app)
      .get(`/api/devices/export/csv?skip_ratelimit=true&status=IN_REPARATIE&riskClass=IIb&sectionId=${sectionId}&search=Aparat`)
      .set('Authorization', `Bearer ${token}`)
      .buffer(true);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
  });
});

describe('GET /api/devices — filtre listă (riskClass + sectionId)', () => {
  it('filtrează după riskClass și sectionId -> 200', async () => {
    await createDevice({ riskClass: 'I' });
    const res = await request(app)
      .get(`/api/devices?riskClass=I&sectionId=${sectionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.devices.every((d) => d.riskClass === 'I')).toBe(true);
  });
});

describe('GET /api/devices/:id/fisa-pdf — cu observații', () => {
  it('generează PDF pentru un device cu notes (secțiunea 6 OBSERVAȚII)', async () => {
    const created = await createDevice({ name: 'Cu observatii', notes: 'Necesită calibrare anuală conform manualului.' });
    const res = await request(app)
      .get(`/api/devices/${created.body.id}/fisa-pdf?skip_ratelimit=true`)
      .set('Authorization', `Bearer ${token}`)
      .buffer(true);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
  });
});

describe('POST /api/devices/:id/upload — variații câmp', () => {
  const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');

  async function cleanupUploaded(fileUrl) {
    if (!fileUrl) return;
    const fs = require('fs');
    const path = require('path');
    const filename = fileUrl.split('/').pop();
    const onDisk = path.join(__dirname, '../../uploads/devices', filename);
    if (fs.existsSync(onDisk)) fs.unlinkSync(onDisk);
  }

  it('fără câmp "field" -> default manualUrl', async () => {
    const created = await createDevice({ name: 'Upload default' });
    const res = await request(app)
      .post(`/api/devices/${created.body.id}/upload`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', pdf, 'doc.pdf');
    expect(res.status).toBe(200);
    expect(res.body.device.manualUrl).toBe(res.body.fileUrl);
    await cleanupUploaded(res.body.fileUrl);
  });

  it('field invalid -> fallback la manualUrl', async () => {
    const created = await createDevice({ name: 'Upload field invalid' });
    const res = await request(app)
      .post(`/api/devices/${created.body.id}/upload`)
      .set('Authorization', `Bearer ${token}`)
      .field('field', 'campNepermis')
      .attach('file', pdf, 'doc.pdf');
    expect(res.status).toBe(200);
    expect(res.body.device.manualUrl).toBe(res.body.fileUrl);
    await cleanupUploaded(res.body.fileUrl);
  });

  it('field permis certificateUrl -> setat corect', async () => {
    const created = await createDevice({ name: 'Upload cert' });
    const res = await request(app)
      .post(`/api/devices/${created.body.id}/upload`)
      .set('Authorization', `Bearer ${token}`)
      .field('field', 'certificateUrl')
      .attach('file', pdf, 'cert.pdf');
    expect(res.status).toBe(200);
    expect(res.body.device.certificateUrl).toBe(res.body.fileUrl);
    await cleanupUploaded(res.body.fileUrl);
  });
});

describe('/api/devices — căi de eroare DB (spy)', () => {
  it('GET / -> 500 când findMany aruncă', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.devices, 'findMany').mockRejectedValueOnce(new Error('DB read fail'));
    const res = await request(app)
      .get('/api/devices')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la preluarea dispozitivelor/i);
    errSpy.mockRestore();
  });

  it('POST / -> 500 când create aruncă', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.devices, 'findUnique').mockResolvedValueOnce(null); // fără duplicat
    vi.spyOn(prisma.devices, 'create').mockRejectedValueOnce(new Error('DB write fail'));
    const res = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({ inventoryNumber: uniqueInv(), name: 'Eroare creare', riskClass: 'I', sectionId });
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la crearea dispozitivului/i);
    errSpy.mockRestore();
  });

  it('GET /:id/fisa-pdf -> 500 când findUnique aruncă', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.devices, 'findUnique').mockRejectedValueOnce(new Error('DB fail'));
    const res = await request(app)
      .get('/api/devices/12345/fisa-pdf?skip_ratelimit=true')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la generarea PDF/i);
    errSpy.mockRestore();
  });

  it('PUT /:id -> 500 când update aruncă', async () => {
    const created = await createDevice({ name: 'Eroare update' });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.devices, 'update').mockRejectedValueOnce(new Error('DB update fail'));
    const res = await request(app)
      .put(`/api/devices/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nume actualizat' });
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la actualizarea dispozitivului/i);
    errSpy.mockRestore();
  });

  it('DELETE /:id -> 500 când update (soft delete) aruncă', async () => {
    const created = await createDevice({ name: 'Eroare delete' });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.devices, 'update').mockRejectedValueOnce(new Error('DB delete fail'));
    const res = await request(app)
      .delete(`/api/devices/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la casat dispozitiv/i);
    errSpy.mockRestore();
  });

  it('GET /:id -> 500 când findUnique aruncă', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.devices, 'findUnique').mockRejectedValueOnce(new Error('DB fail'));
    const res = await request(app)
      .get('/api/devices/424242')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la preluarea dispozitivului/i);
    errSpy.mockRestore();
  });

  it('GET /export/xlsx -> 500 când findMany aruncă', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.devices, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
    const res = await request(app)
      .get('/api/devices/export/xlsx?skip_ratelimit=true')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la export Excel/i);
    errSpy.mockRestore();
  });

  it('GET /export/csv -> 500 când findMany aruncă', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.devices, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
    const res = await request(app)
      .get('/api/devices/export/csv?skip_ratelimit=true')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la export CSV/i);
    errSpy.mockRestore();
  });
});
