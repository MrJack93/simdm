/**
 * Teste pentru modulul Documente — /api/documents
 *
 * Endpoint-uri:
 *   GET    /api/documents            (listă + filtre + paginare)
 *   GET    /api/documents/categories  (dropdown)
 *   GET    /api/documents/:id        (detalii)
 *   POST   /api/documents            (upload + creare)
 *   POST   /api/documents/:id/version (versiune nouă)
 *   PUT    /api/documents/:id        (editare metadate)
 *   DELETE /api/documents/:id        (soft-delete)
 *   GET    /api/documents/file/:filename (servire autentificată)
 */
const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../index');
const prisma = require('../db');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

let token;
const createdIds = [];
const uploadedFiles = [];

function createTestFile(name = 'test-doc.pdf') {
  const dir = path.join(__dirname, '../../uploads/documents');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, '%PDF-1.4 test content');
  uploadedFiles.push(filePath);
  return filePath;
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
    await prisma.documents.deleteMany({ where: { id: { in: ids } } });
  }
});

afterAll(async () => {
  uploadedFiles.forEach((f) => {
    try { fs.unlinkSync(f); } catch {}
  });
  await prisma.$disconnect();
});

describe('Autorizare /api/documents', () => {
  it('GET fără token -> 401 NO_TOKEN', async () => {
    const res = await request(app).get('/api/documents');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('NO_TOKEN');
  });

  it('POST fără token -> 401', async () => {
    const res = await request(app).post('/api/documents');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/documents — listă', () => {
  it('returnează structura paginată { data, pagination }', async () => {
    const res = await request(app)
      .get('/api/documents')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toMatchObject({
      page: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
      pages: expect.any(Number),
    });
  });

  it('filtrează după categorie', async () => {
    const res = await request(app)
      .get('/api/documents?category=PROCEDURA_MDM')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((doc) => {
      expect(doc.category).toBe('PROCEDURA_MDM');
    });
  });

  it('filtrează după search', async () => {
    const marker = `DocTest-${Date.now()}`;
    const filePath = createTestFile(`search-${Date.now()}.pdf`);
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('title', marker)
      .field('category', 'ALTUL')
      .attach('file', filePath);
    createdIds.push(createRes.body.id);

    const res = await request(app)
      .get(`/api/documents?search=${encodeURIComponent(marker)}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((d) => d.title === marker)).toBe(true);
  });

  it('ID dispozitiv invalid -> 400', async () => {
    const res = await request(app)
      .get('/api/documents?deviceId=abc')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/documents/categories', () => {
  it('returnează lista de categorii', async () => {
    const res = await request(app)
      .get('/api/documents/categories')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(8);
    expect(res.body[0]).toHaveProperty('value');
    expect(res.body[0]).toHaveProperty('label');
  });
});

describe('POST /api/documents — upload + creare', () => {
  it('creează document cu fișier isCurrent=true + audit ne-null', async () => {
    const filePath = createTestFile(`create-${Date.now()}.pdf`);
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Test Document')
      .field('category', 'PROCEDURA_MDM')
      .field('description', 'Descriere test')
      .field('tags', JSON.stringify(['test', 'siguranță']))
      .attach('file', filePath);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test Document');
    expect(res.body.category).toBe('PROCEDURA_MDM');
    expect(res.body.isCurrent).toBe(true);
    expect(res.body.isDeleted).toBe(false);
    expect(res.body.version).toBe('1.0');
    expect(res.body.uploadedById).toBeTruthy();
    createdIds.push(res.body.id);

    const audit = await prisma.audit_logs.findFirst({
      where: { entity: 'Document', entityId: String(res.body.id), action: 'CREATE' },
      orderBy: { timestamp: 'desc' },
    });
    expect(audit).toBeTruthy();
    expect(audit.userId).toBeTruthy();
  });

  it('fără fișier -> 400', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Fără fișier')
      .field('category', 'ALTUL');
    expect(res.status).toBe(400);
  });

  it('date invalide (titlu gol) -> 400', async () => {
    const filePath = createTestFile(`invalid-${Date.now()}.pdf`);
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('title', '')
      .field('category', 'ALTUL')
      .attach('file', filePath);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/documents/:id/version', () => {
  it('versiune nouă -> părintele isCurrent=false, copilul isCurrent=true', async () => {
    const filePath1 = createTestFile(`v1-${Date.now()}.pdf`);
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Versioned Doc')
      .field('category', 'FORMULAR')
      .attach('file', filePath1);
    const parentId = createRes.body.id;
    createdIds.push(parentId);

    const filePath2 = createTestFile(`v2-${Date.now()}.pdf`);
    const versionRes = await request(app)
      .post(`/api/documents/${parentId}/version`)
      .set('Authorization', `Bearer ${token}`)
      .field('version', '2.0')
      .attach('file', filePath2);

    expect(versionRes.status).toBe(201);
    expect(versionRes.body.version).toBe('2.0');
    expect(versionRes.body.isCurrent).toBe(true);
    expect(versionRes.body.previousVersionId).toBe(parentId);

    const parent = await prisma.documents.findUnique({ where: { id: parentId } });
    expect(parent.isCurrent).toBe(false);
  });

  it('document inexistent -> 404', async () => {
    const filePath = createTestFile(`orphan-${Date.now()}.pdf`);
    const res = await request(app)
      .post('/api/documents/99999/version')
      .set('Authorization', `Bearer ${token}`)
      .field('version', '2.0')
      .attach('file', filePath);
    expect(res.status).toBe(404);
  });

  it('ID invalid -> 400', async () => {
    const filePath = createTestFile(`invalid-id-${Date.now()}.pdf`);
    const res = await request(app)
      .post('/api/documents/abc/version')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', filePath);
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/documents/:id', () => {
  it('actualizează metadate', async () => {
    const filePath = createTestFile(`edit-${Date.now()}.pdf`);
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Edit Me')
      .field('category', 'ALTUL')
      .attach('file', filePath);
    const docId = createRes.body.id;
    createdIds.push(docId);

    const res = await request(app)
      .put(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Edited Title', category: 'CERTIFICAT' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Edited Title');
    expect(res.body.category).toBe('CERTIFICAT');
  });

  it('document inexistent -> 404', async () => {
    const res = await request(app)
      .put('/api/documents/99999')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Ghost' });
    expect(res.status).toBe(404);
  });

  it('ID invalid -> 400', async () => {
    const res = await request(app)
      .put('/api/documents/abc')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'X' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/documents/:id', () => {
  it('soft-delete setează isDeleted=true + audit DELETE', async () => {
    const filePath = createTestFile(`del-${Date.now()}.pdf`);
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Delete Me')
      .field('category', 'ALTUL')
      .attach('file', filePath);
    const docId = createRes.body.id;

    const res = await request(app)
      .delete(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const doc = await prisma.documents.findUnique({ where: { id: docId } });
    expect(doc.isDeleted).toBe(true);

    const audit = await prisma.audit_logs.findFirst({
      where: { entity: 'Document', entityId: String(docId), action: 'DELETE' },
      orderBy: { timestamp: 'desc' },
    });
    expect(audit).toBeTruthy();
    expect(audit.userId).toBeTruthy();
  });

  it('document inexistent -> 404', async () => {
    const res = await request(app)
      .delete('/api/documents/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('document deja șters -> 409', async () => {
    const filePath = createTestFile(`double-del-${Date.now()}.pdf`);
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Double Delete')
      .field('category', 'ALTUL')
      .attach('file', filePath);
    const docId = createRes.body.id;
    createdIds.push(docId);

    await request(app)
      .delete(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .delete(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(409);
  });

  it('ID invalid -> 400', async () => {
    const res = await request(app)
      .delete('/api/documents/abc')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/documents/file/:filename', () => {
  it('path-traversal respins -> 400', async () => {
    const res = await request(app)
      .get('/api/documents/file/..%2F..%2F.env')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('fișier negăsit -> 404', async () => {
    const res = await request(app)
      .get('/api/documents/file/nonexistent-12345.pdf')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('fără token -> 401', async () => {
    const res = await request(app)
      .get('/api/documents/file/somefile.pdf');
    expect(res.status).toBe(401);
  });
});

describe('Soft-delete exclude din listă', () => {
  it('documentul șters nu apare în GET /', async () => {
    const filePath = createTestFile(`hidden-${Date.now()}.pdf`);
    const marker = `HiddenDoc-${Date.now()}`;
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('title', marker)
      .field('category', 'ALTUL')
      .attach('file', filePath);
    const docId = createRes.body.id;

    await request(app)
      .delete(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${token}`);

    const listRes = await request(app)
      .get(`/api/documents?search=${encodeURIComponent(marker)}`)
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.some((d) => d.id === docId)).toBe(false);
  });
});

// ── FAZA 5.1: HARDENING TESTS ──────────────────────────────────

describe('Faza 5.1 — Hash SHA-256 (Integritate)', () => {
  it('upload salvează fileHash (64 hex chars)', async () => {
    const filePath = createTestFile(`hash-${Date.now()}.pdf`);
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Hash Test')
      .field('category', 'ALTUL')
      .attach('file', filePath);
    expect(res.status).toBe(201);
    expect(res.body.fileHash).toMatch(/^[a-f0-9]{64}$/);
    createdIds.push(res.body.id);
  });

  it('verify pe fișier neschimbat → valid:true', async () => {
    const filePath = createTestFile(`verify-ok-${Date.now()}.pdf`);
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Verify OK')
      .field('category', 'ALTUL')
      .attach('file', filePath);
    const docId = createRes.body.id;
    createdIds.push(docId);

    const res = await request(app)
      .get(`/api/documents/${docId}/verify`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.storedHash).toBeTruthy();
    expect(res.body.currentHash).toBe(res.body.storedHash);
  });

  it('verify pe fișier alterat → valid:false', async () => {
    const filePath = createTestFile(`verify-tamper-${Date.now()}.pdf`);
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Verify Tamper')
      .field('category', 'ALTUL')
      .attach('file', filePath);
    const docId = createRes.body.id;
    createdIds.push(docId);

    const uploadedFilename = createRes.body.fileUrl.split('/').pop();
    const uploadedPath = path.join(__dirname, '../../uploads/documents', uploadedFilename);
    fs.appendFileSync(uploadedPath, 'TAMPER');

    const res = await request(app)
      .get(`/api/documents/${docId}/verify`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
    expect(res.body.storedHash).not.toBe(res.body.currentHash);
  });

  it('verify scrie audit VERIFY cu userId ne-null', async () => {
    const filePath = createTestFile(`verify-audit-${Date.now()}.pdf`);
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Verify Audit')
      .field('category', 'ALTUL')
      .attach('file', filePath);
    const docId = createRes.body.id;
    createdIds.push(docId);

    await request(app)
      .get(`/api/documents/${docId}/verify`)
      .set('Authorization', `Bearer ${token}`);

    const log = await prisma.audit_logs.findFirst({
      where: { entity: 'Document', entityId: String(docId), action: 'VERIFY' },
      orderBy: { timestamp: 'desc' },
    });
    expect(log).toBeTruthy();
    expect(log.userId).toBeTruthy();
  });

  it('verify pe document inexistent → 404', async () => {
    const res = await request(app)
      .get('/api/documents/99999/verify')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('verify pe document cu fișier șters de pe disc → 404', async () => {
    const filePath = createTestFile(`verify-missing-${Date.now()}.pdf`);
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Verify Missing')
      .field('category', 'ALTUL')
      .attach('file', filePath);
    const docId = createRes.body.id;
    createdIds.push(docId);

    const uploadedFilename = createRes.body.fileUrl.split('/').pop();
    const uploadedPath = path.join(__dirname, '../../uploads/documents', uploadedFilename);
    try { fs.unlinkSync(uploadedPath); } catch {}

    const res = await request(app)
      .get(`/api/documents/${docId}/verify`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('Faza 5.1 — Expirare + alerte', () => {
  it('GET /expiring returnează documente clasificate', async () => {
    const filePath = createTestFile(`exp-${Date.now()}.pdf`);
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Expired Cert')
      .field('category', 'CERTIFICAT')
      .field('issuer', 'Test Issuer')
      .field('validUntil', pastDate)
      .attach('file', filePath);
    const docId = createRes.body.id;
    createdIds.push(docId);

    const res = await request(app)
      .get('/api/documents/expiring?days=60')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.summary).toHaveProperty('expirat');
    expect(res.body.summary).toHaveProperty('expiraCurand');
    const found = res.body.data.find((d) => d.id === docId);
    expect(found).toBeTruthy();
    expect(found.status).toBe('EXPIRAT');
  });

  it('CERTIFICAT fără validUntil → 400', async () => {
    const filePath = createTestFile(`no-exp-${Date.now()}.pdf`);
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Cert No Exp')
      .field('category', 'CERTIFICAT')
      .field('issuer', 'Test Issuer')
      .attach('file', filePath);
    expect(res.status).toBe(400);
  });

  it('CERTIFICAT fără issuer → 400', async () => {
    const filePath = createTestFile(`no-issuer-${Date.now()}.pdf`);
    const futureDate = new Date(Date.now() + 86400000 * 365).toISOString();
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Cert No Issuer')
      .field('category', 'CERTIFICAT')
      .field('validUntil', futureDate)
      .attach('file', filePath);
    expect(res.status).toBe(400);
  });

  it('ALTUL fără validUntil/issuer → 201 (nu sunt cerute)', async () => {
    const filePath = createTestFile(`altul-ok-${Date.now()}.pdf`);
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Altul OK')
      .field('category', 'ALTUL')
      .attach('file', filePath);
    expect(res.status).toBe(201);
    createdIds.push(res.body.id);
  });
});

describe('Faza 5.1 — Jurnal de acces', () => {
  it('access-log returnează intrări cu userId ne-null', async () => {
    const filePath = createTestFile(`alog-${Date.now()}.pdf`);
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Access Log Test')
      .field('category', 'ALTUL')
      .attach('file', filePath);
    const docId = createRes.body.id;
    createdIds.push(docId);

    const res = await request(app)
      .get(`/api/documents/${docId}/access-log`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    if (res.body.data.length > 0) {
      expect(res.body.data[0].userId).toBeTruthy();
    }
  });

  it('după descărcare, access-log conține FILE_ACCESS cu userId', async () => {
    const filePath = createTestFile(`alog-dl-${Date.now()}.pdf`);
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Access DL Test')
      .field('category', 'ALTUL')
      .attach('file', filePath);
    const docId = createRes.body.id;
    createdIds.push(docId);
    const filename = createRes.body.fileUrl.split('/').pop();

    await request(app)
      .get(`/api/documents/file/${filename}`)
      .set('Authorization', `Bearer ${token}`);

    const logRes = await request(app)
      .get(`/api/documents/${docId}/access-log`)
      .set('Authorization', `Bearer ${token}`);
    expect(logRes.status).toBe(200);
    const fileAccess = logRes.body.data.find((l) => l.action === 'FILE_ACCESS');
    expect(fileAccess).toBeTruthy();
    expect(fileAccess.userId).toBeTruthy();
  });

  it('access-log pe document inexistent → 404', async () => {
    const res = await request(app)
      .get('/api/documents/99999/access-log')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('access-log id invalid → 400', async () => {
    const res = await request(app)
      .get('/api/documents/abc/access-log')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});

describe('Faza 5.1 — Metadate condiționate', () => {
  it('POST cu issuer + validFrom + validUntil salvate', async () => {
    const filePath = createTestFile(`meta-${Date.now()}.pdf`);
    const futureDate = new Date(Date.now() + 86400000 * 365).toISOString();
    const fromDate = new Date(Date.now() - 86400000 * 30).toISOString();
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Contract Full Meta')
      .field('category', 'CONTRACT')
      .field('issuer', 'Service Provider SRL')
      .field('validFrom', fromDate)
      .field('validUntil', futureDate)
      .attach('file', filePath);
    expect(res.status).toBe(201);
    expect(res.body.issuer).toBe('Service Provider SRL');
    expect(res.body.validFrom).toBeTruthy();
    expect(res.body.validUntil).toBeTruthy();
    createdIds.push(res.body.id);
  });

  it('CERTIFICAT cu issuer+validUntil → 201', async () => {
    const filePath = createTestFile(`cert-valid-${Date.now()}.pdf`);
    const futureDate = new Date(Date.now() + 86400000 * 365).toISOString();
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Cert Valid')
      .field('category', 'CERTIFICAT')
      .field('issuer', 'AMDM')
      .field('validUntil', futureDate)
      .attach('file', filePath);
    expect(res.status).toBe(201);
    expect(res.body.category).toBe('CERTIFICAT');
    expect(res.body.issuer).toBe('AMDM');
    expect(res.body.validUntil).toBeTruthy();
    createdIds.push(res.body.id);
  });

  it('PUT actualizează issuer + validUntil', async () => {
    const filePath = createTestFile(`meta-upd-${Date.now()}.pdf`);
    const futureDate = new Date(Date.now() + 86400000 * 365).toISOString();
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Meta Update Test')
      .field('category', 'CERTIFICAT')
      .field('issuer', 'Old Issuer')
      .field('validUntil', futureDate)
      .attach('file', filePath);
    const docId = createRes.body.id;
    createdIds.push(docId);

    const newDate = new Date(Date.now() + 86400000 * 730).toISOString();
    const res = await request(app)
      .put(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ issuer: 'New Issuer', validUntil: newDate });
    expect(res.status).toBe(200);
    expect(res.body.issuer).toBe('New Issuer');
  });
});
