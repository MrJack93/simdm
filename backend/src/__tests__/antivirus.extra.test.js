/**
 * Teste suplimentare pentru middleware-ul antivirus — acoperă căile rar atinse:
 *   - validateFileType: fișier nedetectabil cu MIME sigur -> valid:true
 *   - validateFileType: MIME mismatch (detectat != original) -> avertisment
 *   - scanWithClamAV: CLAMAV_ENABLED=true
 *       * scanare curată / scanare cu virus (clamscan injectat în require.cache)
 *       * eroare la init (ClamAV indisponibil) -> scanned:false (clamscan real)
 *   - antivirusMiddleware: fișier infectat -> 400 + fișier șters
 *
 * NOTĂ: src/middleware/antivirus.js face `require('clamscan')` LAZY, în interiorul
 * funcției. În CommonJS, vi.mock nu interceptează fiabil un require lazy, așa că
 * injectăm un modul fals direct în require.cache (cleanup la final).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const CLAMSCAN_PATH = require.resolve('clamscan');
const realClamModule = require.cache[CLAMSCAN_PATH]; // poate fi undefined dacă nu e încărcat încă

// Controlează comportamentul clamscan-ului fals
let clamBehavior = 'clean';

function FakeNodeClam() {}
FakeNodeClam.prototype.init = async function init() {
  return {
    scanFile: async () => {
      if (clamBehavior === 'infected') {
        return { isInfected: true, viruses: ['Eicar-Test-Signature'] };
      }
      return { isInfected: false, viruses: [] };
    },
  };
};

function installFakeClam() {
  require.cache[CLAMSCAN_PATH] = {
    id: CLAMSCAN_PATH,
    filename: CLAMSCAN_PATH,
    loaded: true,
    exports: FakeNodeClam,
  };
}
function restoreRealClam() {
  if (realClamModule) {
    require.cache[CLAMSCAN_PATH] = realClamModule;
  } else {
    delete require.cache[CLAMSCAN_PATH];
  }
}

const {
  antivirusMiddleware,
  validateFileType,
  scanWithClamAV,
} = require('../middleware/antivirus');

const tmpFiles = [];
function writeTmp(name, buffer) {
  const p = path.join(os.tmpdir(), `simdm-avx-${Date.now()}-${Math.random().toString(36).slice(2)}-${name}`);
  fs.writeFileSync(p, buffer);
  tmpFiles.push(p);
  return p;
}
function pdfBuffer() {
  return Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
}
function pngBuffer() {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
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
  restoreRealClam();
});

describe('validateFileType — căi marginale', () => {
  it('acceptă un fișier nedetectabil dar cu MIME în lista sigură', async () => {
    const txt = writeTmp('note.txt', Buffer.from('doar text fara semnatura binara'));
    const result = await validateFileType(txt, 'text/plain');
    expect(result.valid).toBe(true);
    expect(result.detected).toBe('unknown');
    expect(result.original).toBe('text/plain');
  });

  it('acceptă fișierul dar semnalează MIME mismatch (detectat != original)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const png = writeTmp('mismatch.png', pngBuffer());
    const result = await validateFileType(png, 'image/jpeg');
    expect(result.valid).toBe(true);
    expect(result.detected).toBe('image/png');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe('scanWithClamAV — CLAMAV_ENABLED=true', () => {
  const prevEnabled = process.env.CLAMAV_ENABLED;
  beforeEach(() => {
    process.env.CLAMAV_ENABLED = 'true';
  });
  afterEach(() => {
    restoreRealClam();
  });
  afterAll(() => {
    if (prevEnabled === undefined) delete process.env.CLAMAV_ENABLED;
    else process.env.CLAMAV_ENABLED = prevEnabled;
  });

  it('returnează scanned:true, infected:false pentru un fișier curat (clamscan injectat)', async () => {
    installFakeClam();
    clamBehavior = 'clean';
    const file = writeTmp('clean.pdf', pdfBuffer());
    const result = await scanWithClamAV(file);
    expect(result.scanned).toBe(true);
    expect(result.infected).toBe(false);
    expect(result.viruses).toEqual([]);
  });

  it('returnează infected:true și lista de viruși pentru un fișier infectat (injectat)', async () => {
    installFakeClam();
    clamBehavior = 'infected';
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const file = writeTmp('virus.pdf', pdfBuffer());
    const result = await scanWithClamAV(file);
    expect(result.scanned).toBe(true);
    expect(result.infected).toBe(true);
    expect(result.viruses).toContain('Eicar-Test-Signature');
    errSpy.mockRestore();
  });

  it('cade elegant când ClamAV este indisponibil (clamscan real, fără daemon)', async () => {
    restoreRealClam(); // folosește biblioteca reală, care nu găsește daemon
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const file = writeTmp('na.pdf', pdfBuffer());
    const result = await scanWithClamAV(file);
    expect(result.scanned).toBe(false);
    expect(result.infected).toBe(false);
    expect(result.reason).toBeDefined();
    warnSpy.mockRestore();
  });
});

describe('antivirusMiddleware — fișier infectat', () => {
  const prevEnabled = process.env.CLAMAV_ENABLED;
  afterEach(() => {
    restoreRealClam();
  });
  afterAll(() => {
    if (prevEnabled === undefined) delete process.env.CLAMAV_ENABLED;
    else process.env.CLAMAV_ENABLED = prevEnabled;
  });

  it('respinge cu 400 și șterge fișierul când ClamAV raportează infecție', async () => {
    process.env.CLAMAV_ENABLED = 'true';
    installFakeClam();
    clamBehavior = 'infected';
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const file = writeTmp('infected.pdf', pdfBuffer());
    const req = { file: { path: file, size: 1024, mimetype: 'application/pdf' } };
    const res = fakeRes();
    let nextCalled = false;
    await antivirusMiddleware(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/infectat/i);
    expect(fs.existsSync(file)).toBe(false);
    errSpy.mockRestore();
  });
});
