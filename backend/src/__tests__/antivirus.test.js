/**
 * Teste pentru middleware-ul antivirus (src/middleware/antivirus.js)
 *
 * Funcții testate (export direct, fără stratul HTTP):
 *   - validateFileType(filePath, mimetype) — validare prin magic bytes
 *   - scanWithClamAV(filePath)             — skip când CLAMAV_ENABLED != true
 *   - antivirusMiddleware(req, res, next)  — limită mărime + tip fișier
 *
 * Fișierele de test sunt create temporar în os.tmpdir() și șterse după.
 * Un PDF este recunoscut prin magic bytes "%PDF-".
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  antivirusMiddleware,
  validateFileType,
  scanWithClamAV,
} = require('../middleware/antivirus');

const tmpFiles = [];

// Scrie un fișier temporar și reține calea pentru curățenie
function writeTmp(name, buffer) {
  const p = path.join(os.tmpdir(), `simdm-av-${Date.now()}-${Math.random().toString(36).slice(2)}-${name}`);
  fs.writeFileSync(p, buffer);
  tmpFiles.push(p);
  return p;
}

// PDF minim valid (magic bytes %PDF-)
function pdfBuffer() {
  return Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
}

// PNG minim valid (semnătura PNG)
function pngBuffer() {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
  ]);
}

function fakeRes() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

afterAll(() => {
  for (const f of tmpFiles) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
});

describe('validateFileType — fișier curat', () => {
  it('acceptă un PDF valid (magic bytes %PDF)', async () => {
    const file = writeTmp('clean.pdf', pdfBuffer());
    const result = await validateFileType(file, 'application/pdf');
    expect(result.valid).toBe(true);
    expect(result.detected).toBe('application/pdf');
  });

  it('acceptă un PNG valid (semnătură PNG)', async () => {
    const file = writeTmp('clean.png', pngBuffer());
    const result = await validateFileType(file, 'image/png');
    expect(result.valid).toBe(true);
    expect(result.detected).toBe('image/png');
  });
});

describe('validateFileType — tip nesuportat / MIME invalid', () => {
  it('respinge un fișier al cărui tip detectat nu e în lista sigură', async () => {
    // Fișier ZIP (magic bytes PK) — nu e în SAFE_MIME_TYPES
    const zip = writeTmp('arhiva.zip', Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]));
    await expect(
      validateFileType(zip, 'application/zip')
    ).rejects.toThrow(/nesuportat/i);
  });

  it('respinge un MIME necunoscut când tipul nu poate fi detectat', async () => {
    // Conținut text simplu, nedetectabil prin magic bytes; MIME în afara listei
    const txt = writeTmp('necunoscut.bin', Buffer.from('continut oarecare fara semnatura'));
    await expect(
      validateFileType(txt, 'application/x-malware')
    ).rejects.toThrow(/nesuportat/i);
  });
});

describe('scanWithClamAV', () => {
  it('sare peste scanare când CLAMAV_ENABLED nu este "true"', async () => {
    const prev = process.env.CLAMAV_ENABLED;
    delete process.env.CLAMAV_ENABLED;
    const file = writeTmp('skip.pdf', pdfBuffer());
    const result = await scanWithClamAV(file);
    expect(result.scanned).toBe(false);
    expect(result.infected).toBe(false);
    if (prev !== undefined) process.env.CLAMAV_ENABLED = prev;
  });
});

describe('antivirusMiddleware', () => {
  it('apelează next() fără fișier (req.file lipsește)', async () => {
    const req = {};
    const res = fakeRes();
    let nextCalled = false;
    await antivirusMiddleware(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
    expect(res.statusCode).toBeNull();
  });

  it('respinge un fișier peste limita de 10MB -> 400', async () => {
    const file = writeTmp('mare.pdf', pdfBuffer());
    const req = {
      file: { path: file, size: 11 * 1024 * 1024, mimetype: 'application/pdf' },
    };
    const res = fakeRes();
    let nextCalled = false;
    await antivirusMiddleware(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/prea mare/i);
  });

  it('trece un PDF valid sub limită și populează req.fileScanResult', async () => {
    const file = writeTmp('valid.pdf', pdfBuffer());
    const req = {
      file: { path: file, size: 1024, mimetype: 'application/pdf' },
    };
    const res = fakeRes();
    let nextCalled = false;
    await antivirusMiddleware(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
    expect(res.statusCode).toBeNull();
    expect(req.fileScanResult).toBeDefined();
    expect(req.fileScanResult.mimeType).toBe('application/pdf');
  });

  it('respinge și șterge un fișier cu tip nesigur -> 400', async () => {
    const file = writeTmp('rau.zip', Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]));
    const req = {
      file: { path: file, size: 100, mimetype: 'application/zip' },
    };
    const res = fakeRes();
    let nextCalled = false;
    await antivirusMiddleware(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(400);
    // middleware-ul șterge fișierul respins
    expect(fs.existsSync(file)).toBe(false);
  });
});
