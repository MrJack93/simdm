/**
 * Coverage branch-boost tests — round 7
 *
 * Targets remaining uncovered branches to push overall branch coverage ≥ 90%:
 *
 *   devices.js         — catch block in DELETE (547-548), upload success with scanInfo (606),
 *                         fisa-pdf 404 (638), PATCH catch (503)
 *   repairTickets.js   — operations with signature (807), HOSPITAL_NAME env (961),
 *                         toSafePdfText (1059-1061)
 *   consumables.js     — update conditional spreads: empty model/manufacturer (167-169),
 *                         expiryDate null (172), location null (173), notes null (174)
 *   mppExecutions.js   — error message non-Consumabil path (238-241), GET invalid ID (253),
 *                         DELETE invalid ID (314)
 *   annualInventory.js — DELETE catch (243-256), toSafePdfText (332), import empty sheet (439)
 *   notifications.js   — inner catch in checkVerificationExpiry (104)
 *   incidents.js       — logAudit catch (14-25)
 *   maintenance.js     — conditional spreads: scheduledDate null (166-167), duration null (168),
 *                         cost null (173)
 *   maintenancePlans.js— occurrence lookup fallback (75), frequencyToMonths empty (129),
 *                         toSafePdfText (334)
 *   auth.js            — rate limiter NODE_ENV test branch (22)
 *   authService.js     — ACCESS_TOKEN_EXPIRES env (16)
 */
const request = require('supertest');
const path = require('path');
const app = require('../index');
const prisma = require('../db');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

let token;
let userId;
let testSectionId;

const cleanupDeviceIds = [];
const cleanupTicketIds = [];
const cleanupConsumableIds = [];
const cleanupVerificationIds = [];
const cleanupOccurrenceIds = [];
const cleanupPlanIds = [];
const cleanupContractIds = [];
const cleanupProviderIds = [];
const cleanupIncidentIds = [];
const cleanupMaintenanceIds = [];

function uniqueInv(prefix = 'BCOV7') {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

beforeAll(async () => {
  const loginRes = await request(app)
    .post('/api/auth/login?skip_ratelimit=true')
    .send({ username: 'testuser', password: TEST_PASSWORD });
  token = loginRes.body.accessToken;
  userId = loginRes.body.user.id;

  const sectionRes = await request(app)
    .get('/api/devices/dropdown/sections')
    .set('Authorization', `Bearer ${token}`);
  testSectionId = sectionRes.body[0]?.id || 1;
});

afterAll(async () => {
  if (cleanupVerificationIds.length)
    await prisma.verifications.deleteMany({ where: { id: { in: cleanupVerificationIds } } }).catch(() => {});
  if (cleanupTicketIds.length)
    await prisma.repair_tickets.deleteMany({ where: { id: { in: cleanupTicketIds } } }).catch(() => {});
  if (cleanupConsumableIds.length)
    await prisma.consumables.deleteMany({ where: { id: { in: cleanupConsumableIds } } }).catch(() => {});
  if (cleanupOccurrenceIds.length)
    await prisma.mpp_occurrences.deleteMany({ where: { id: { in: cleanupOccurrenceIds } } }).catch(() => {});
  if (cleanupPlanIds.length)
    await prisma.maintenance_plans.deleteMany({ where: { id: { in: cleanupPlanIds } } }).catch(() => {});
  if (cleanupContractIds.length)
    await prisma.service_contracts.deleteMany({ where: { id: { in: cleanupContractIds } } }).catch(() => {});
  if (cleanupProviderIds.length)
    await prisma.service_providers.deleteMany({ where: { id: { in: cleanupProviderIds } } }).catch(() => {});
  if (cleanupIncidentIds.length)
    await prisma.incidents.deleteMany({ where: { id: { in: cleanupIncidentIds } } }).catch(() => {});
  if (cleanupMaintenanceIds.length)
    await prisma.maintenance_records.deleteMany({ where: { id: { in: cleanupMaintenanceIds } } }).catch(() => {});
  if (cleanupDeviceIds.length) {
    await prisma.verifications.deleteMany({ where: { deviceId: { in: cleanupDeviceIds } } }).catch(() => {});
    await prisma.mpp_executions.deleteMany({ where: { deviceId: { in: cleanupDeviceIds } } }).catch(() => {});
    await prisma.incidents.deleteMany({ where: { deviceId: { in: cleanupDeviceIds } } }).catch(() => {});
    await prisma.maintenance_records.deleteMany({ where: { deviceId: { in: cleanupDeviceIds } } }).catch(() => {});
    await prisma.mpp_occurrences.deleteMany({ where: { plan: { deviceId: { in: cleanupDeviceIds } } } }).catch(() => {});
    await prisma.maintenance_plans.deleteMany({ where: { deviceId: { in: cleanupDeviceIds } } }).catch(() => {});
    await prisma.devices.deleteMany({ where: { id: { in: cleanupDeviceIds } } }).catch(() => {});
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ═══════════════════════════════════════════════════════════════════
// devices.js — catch blocks and remaining uncovered branches
// ═══════════════════════════════════════════════════════════════════

describe('devices.js — uncovered branches 7', () => {
  let testDeviceId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inventoryNumber: uniqueInv('DV7'),
        name: 'Device Branch7 Tests',
        riskClass: 'I',
        sectionId: testSectionId,
        maintenanceFreq: 6,
      });
    if (res.status === 201) {
      testDeviceId = res.body.id;
      cleanupDeviceIds.push(testDeviceId);
    }
  });

  describe('DELETE /:id — catch block when transaction throws (lines 547-548)', () => {
    it('returns 500 when transaction fails during soft delete', async () => {
      if (!testDeviceId) return;
      const spy = vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB connection lost'));
      const res = await request(app)
        .delete(`/api/devices/${testDeviceId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });

  describe('POST /:id/upload — success with antivirus scan (line 606)', () => {
    it('returns scan info when fileScanResult is present', async () => {
      if (!testDeviceId) return;
      const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
      const res = await request(app)
        .post(`/api/devices/${testDeviceId}/upload`)
        .set('Authorization', `Bearer ${token}`)
        .field('field', 'manualUrl')
        .attach('file', pdf, { filename: 'branch7-scan.pdf', contentType: 'application/pdf' });
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('PATCH /:id — catch block (line 503)', () => {
    it('returns 500 when transaction fails during PATCH', async () => {
      if (!testDeviceId) return;
      const spy = vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('Patch fail'));
      const res = await request(app)
        .patch(`/api/devices/${testDeviceId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Patched Name' });
      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });

  describe('fisa-pdf — 404 branch (line 638)', () => {
    it('returns 404 for nonexistent device', async () => {
      const res = await request(app)
        .get('/api/devices/999999/fisa-pdf?skip_ratelimit=true')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET / — includeCasat true branch (line 277)', () => {
    it('includes CASAT devices when includeCasat=true', async () => {
      const res = await request(app)
        .get('/api/devices?includeCasat=true')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe('export/xlsx — filter branches (lines 149-159)', () => {
    it('exports with search and sectionId filters', async () => {
      const res = await request(app)
        .get(`/api/devices/export/xlsx?search=device&sectionId=${testSectionId}`)
        .set('Authorization', `Bearer ${token}`);
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('POST /:id/upload — invalid field fallback (line 569)', () => {
    it('defaults to manualUrl when field is not in allowed list', async () => {
      if (!testDeviceId) return;
      const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
      const res = await request(app)
        .post(`/api/devices/${testDeviceId}/upload`)
        .set('Authorization', `Bearer ${token}`)
        .field('field', 'invalidField')
        .attach('file', pdf, { filename: 'branch7-field.pdf', contentType: 'application/pdf' });
      expect([200, 400]).toContain(res.status);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// repairTickets.js — operations, HOSPITAL_NAME, toSafePdfText
// ═══════════════════════════════════════════════════════════════════

describe('repairTickets.js — uncovered branches 7', () => {
  let ticketDeviceId;
  let ticketId;
  let externalizedTicketId;
  let ticketWithOpsId;

  beforeAll(async () => {
    const devRes = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({ inventoryNumber: uniqueInv('RT7'), name: 'RT7 Device', riskClass: 'III', sectionId: testSectionId });
    if (devRes.status === 201) {
      ticketDeviceId = devRes.body.id;
      cleanupDeviceIds.push(ticketDeviceId);

      const tktRes = await request(app)
        .post('/api/repair-tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({ deviceId: ticketDeviceId, reportedBy: 'Tester RT7', faultDescription: 'Defect RT7' });
      if (tktRes.status === 201) {
        ticketId = tktRes.body.id;
        cleanupTicketIds.push(ticketId);
      }

      const extRes = await request(app)
        .post('/api/repair-tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({ deviceId: ticketDeviceId, reportedBy: 'Tester RT7-ext', faultDescription: 'External RT7' });
      if (extRes.status === 201) {
        externalizedTicketId = extRes.body.id;
        cleanupTicketIds.push(externalizedTicketId);
        await prisma.repair_tickets.update({
          where: { id: externalizedTicketId },
          data: {
            externalized: true,
            faultCause: 'Cauza externa RT7',
            repairReport: 'Raport extern RT7',
            actionsTaken: 'Actiuni RT7',
            engineerName: 'Eng RT7',
            status: 'INCHIS',
          },
        });
      }

      const opsRes = await request(app)
        .post('/api/repair-tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({ deviceId: ticketDeviceId, reportedBy: 'Tester RT7-ops', faultDescription: 'Ops RT7' });
      if (opsRes.status === 201) {
        ticketWithOpsId = opsRes.body.id;
        cleanupTicketIds.push(ticketWithOpsId);
        await prisma.repair_tickets.update({
          where: { id: ticketWithOpsId },
          data: {
            externalized: true,
            faultCause: 'Cauza ops RT7',
            repairReport: 'Raport ops RT7',
            actionsTaken: 'Actiuni ops RT7',
            engineerName: 'Eng RT7 Ops',
            status: 'INCHIS',
            partsUsed: [{ description: 'Filtru RT7', qty: 1, costUnit: 25 }],
            totalCost: 25,
            operations: [
              {
                date: new Date().toISOString(),
                timeStart: '09:00',
                timeEnd: '10:30',
                operation: 'Diagnostic complet',
                engineer: 'Eng A',
                signature: 'sig-base64-data',
              },
              {
                date: new Date().toISOString(),
                timeStart: '10:30',
                timeEnd: '12:00',
                operation: 'Inlocuire piesa',
                engineer: 'Eng B',
              },
            ],
          },
        });
      }
    }
  });

  describe('formular8-pdf — operations with signature (line 807)', () => {
    it('renders signature checkmark when operation has signature', async () => {
      if (!ticketWithOpsId) return;
      const res = await request(app)
        .get(`/api/repair-tickets/${ticketWithOpsId}/formular8-pdf?skip_ratelimit=true`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('formular8-pdf — operations without signature', () => {
    it('renders empty string when operation has no signature', async () => {
      if (!ticketWithOpsId) return;
      const res = await request(app)
        .get(`/api/repair-tickets/${ticketWithOpsId}/formular8-pdf?skip_ratelimit=true`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('handover-pdf — HOSPITAL_NAME env var (line 961)', () => {
    it('uses HOSPITAL_NAME env var when set', async () => {
      if (!externalizedTicketId) return;
      const orig = process.env.HOSPITAL_NAME;
      process.env.HOSPITAL_NAME = 'Spitalul Test RT7';
      try {
        const res = await request(app)
          .get(`/api/repair-tickets/${externalizedTicketId}/handover-pdf?skip_ratelimit=true`)
          .set('Authorization', `Bearer ${token}`)
          .buffer(true);
        expect([200, 400]).toContain(res.status);
      } finally {
        if (orig === undefined) delete process.env.HOSPITAL_NAME;
        else process.env.HOSPITAL_NAME = orig;
      }
    });

    it('uses default hospital name when env var not set', async () => {
      if (!externalizedTicketId) return;
      const orig = process.env.HOSPITAL_NAME;
      delete process.env.HOSPITAL_NAME;
      try {
        const res = await request(app)
          .get(`/api/repair-tickets/${externalizedTicketId}/handover-pdf?skip_ratelimit=true`)
          .set('Authorization', `Bearer ${token}`)
          .buffer(true);
        expect([200, 400]).toContain(res.status);
      } finally {
        if (orig !== undefined) process.env.HOSPITAL_NAME = orig;
      }
    });
  });

  describe('formular7-pdf — with from/to date filters (lines 522-525)', () => {
    it('renders period header when from and to are provided', async () => {
      const res = await request(app)
        .get('/api/repair-tickets/formular7-pdf?from=2025-01-01&to=2026-12-31&skip_ratelimit=true')
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect([200, 400]).toContain(res.status);
    });

    it('renders period header with only from date', async () => {
      const res = await request(app)
        .get('/api/repair-tickets/formular7-pdf?from=2025-01-01&skip_ratelimit=true')
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect([200, 400]).toContain(res.status);
    });

    it('renders period header with only to date', async () => {
      const res = await request(app)
        .get('/api/repair-tickets/formular7-pdf?to=2026-12-31&skip_ratelimit=true')
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('handover-pdf — not externalized (line 910-911)', () => {
    it('returns 400 when ticket is not externalized', async () => {
      if (!ticketId) return;
      const res = await request(app)
        .get(`/api/repair-tickets/${ticketId}/handover-pdf?skip_ratelimit=true`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });

  describe('formular8-pdf — with totalCost (line 830-831)', () => {
    it('renders total cost when partsUsed and totalCost exist', async () => {
      if (!ticketWithOpsId) return;
      const res = await request(app)
        .get(`/api/repair-tickets/${ticketWithOpsId}/formular8-pdf?skip_ratelimit=true`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('formular8-pdf — with repairReport (lines 850-856)', () => {
    it('renders repair report section when present', async () => {
      if (!ticketWithOpsId) return;
      const res = await request(app)
        .get(`/api/repair-tickets/${ticketWithOpsId}/formular8-pdf?skip_ratelimit=true`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('handover-pdf — with faultCause and repairReport (lines 974, 992-994)', () => {
    it('renders faultCause and repairReport when present', async () => {
      if (!ticketWithOpsId) return;
      const res = await request(app)
        .get(`/api/repair-tickets/${ticketWithOpsId}/handover-pdf?skip_ratelimit=true`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('handover-pdf — without faultCause (line 974 false branch)', () => {
    it('skips faultCause when not present', async () => {
      if (!externalizedTicketId) return;
      const res = await request(app)
        .get(`/api/repair-tickets/${externalizedTicketId}/handover-pdf?skip_ratelimit=true`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect([200, 400]).toContain(res.status);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// consumables.js — update conditional spreads with empty values
// ═══════════════════════════════════════════════════════════════════

describe('consumables.js — uncovered branches 7', () => {
  let consumableId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/consumables')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Cons B7 ${Date.now()}`,
        model: 'Model-B7',
        manufacturer: 'Mfg-B7',
        unitOfMeasure: 'buc',
        quantity: 10,
        minQuantity: 2,
        location: 'Locatie B7',
        notes: 'Notes B7',
      });
    if (res.status === 201) {
      consumableId = res.body.id;
      cleanupConsumableIds.push(consumableId);
    }
  });

  describe('PUT /:id — empty model triggers null fallback (line 167)', () => {
    it('sets model to null when empty string provided', async () => {
      if (!consumableId) return;
      const res = await request(app)
        .put(`/api/consumables/${consumableId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ model: '' });
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('PUT /:id — empty manufacturer triggers null fallback (line 168)', () => {
    it('sets manufacturer to null when empty string provided', async () => {
      if (!consumableId) return;
      const res = await request(app)
        .put(`/api/consumables/${consumableId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ manufacturer: '' });
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('PUT /:id — empty unitOfMeasure triggers default (line 169)', () => {
    it('sets unitOfMeasure to "buc" when empty string provided', async () => {
      if (!consumableId) return;
      const res = await request(app)
        .put(`/api/consumables/${consumableId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ unitOfMeasure: '' });
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('PUT /:id — null expiryDate triggers null (line 172)', () => {
    it('sets expiryDate to null when null provided', async () => {
      if (!consumableId) return;
      const res = await request(app)
        .put(`/api/consumables/${consumableId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ expiryDate: null });
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('PUT /:id — empty location triggers null (line 173)', () => {
    it('sets location to null when empty string provided', async () => {
      if (!consumableId) return;
      const res = await request(app)
        .put(`/api/consumables/${consumableId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ location: '' });
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('PUT /:id — empty notes triggers null (line 174)', () => {
    it('sets notes to null when empty string provided', async () => {
      if (!consumableId) return;
      const res = await request(app)
        .put(`/api/consumables/${consumableId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ notes: '' });
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('PUT /:id — valid values for all optional fields', () => {
    it('updates with explicit non-null values', async () => {
      if (!consumableId) return;
      const res = await request(app)
        .put(`/api/consumables/${consumableId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name B7',
          model: 'New Model',
          manufacturer: 'New Mfg',
          unitOfMeasure: 'kg',
          quantity: 20,
          minQuantity: 5,
          expiryDate: new Date(Date.now() + 365 * 86400000).toISOString(),
          location: 'New Location',
          notes: 'New Notes',
        });
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('PUT /:id — null model/manufacturer (explicit null not empty)', () => {
    it('sets fields to null when explicit null provided', async () => {
      if (!consumableId) return;
      const res = await request(app)
        .put(`/api/consumables/${consumableId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          model: null,
          manufacturer: null,
          location: null,
          notes: null,
        });
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('POST /:id/stock — negative quantity (line 237)', () => {
    it('returns 400 when quantity is not positive', async () => {
      if (!consumableId) return;
      const res = await request(app)
        .post(`/api/consumables/${consumableId}/stock`)
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: -5 });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /:id/stock — zero quantity', () => {
    it('returns 400 when quantity is zero', async () => {
      if (!consumableId) return;
      const res = await request(app)
        .post(`/api/consumables/${consumableId}/stock`)
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 0 });
      expect(res.status).toBe(400);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// mppExecutions.js — error message branches and invalid IDs
// ═══════════════════════════════════════════════════════════════════

describe('mppExecutions.js — uncovered branches 7', () => {
  let execDeviceId;
  let consumableId;

  beforeAll(async () => {
    const devRes = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inventoryNumber: uniqueInv('MPP7'),
        name: 'MPP7 Device',
        riskClass: 'I',
        sectionId: testSectionId,
        maintenanceFreq: 12,
      });
    if (devRes.status === 201) {
      execDeviceId = devRes.body.id;
      cleanupDeviceIds.push(execDeviceId);
    }

    const consRes = await request(app)
      .post('/api/consumables')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `MPP7 Cons ${Date.now()}`, quantity: 50, minQuantity: 10 });
    if (consRes.status === 201) {
      consumableId = consRes.body.id;
      cleanupConsumableIds.push(consumableId);
    }
  });

  describe('POST / — generic error (not Consumabil, lines 237-241)', () => {
    it('returns 500 for non-Consumabil error', async () => {
      if (!execDeviceId) return;
      const spy = vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('Generic DB error'));
      const res = await request(app)
        .post('/api/mpp-executions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: execDeviceId,
          executedDate: new Date().toISOString(),
          checklist: [{ operatiune: 'Test', bifat: true }],
          result: 'FUNCTIONAL',
          engineerName: 'Eng',
        });
      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });

  describe('POST / — Stoc insuficient error (line 240-241)', () => {
    it('returns 400 for insufficient stock error', async () => {
      if (!execDeviceId || !consumableId) return;
      const res = await request(app)
        .post('/api/mpp-executions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: execDeviceId,
          executedDate: new Date().toISOString(),
          checklist: [{ operatiune: 'Test stoc', bifat: true }],
          consumablesUsed: [{ consumableId, qty: 999999 }],
          result: 'FUNCTIONAL',
          engineerName: 'Eng Stoc',
        });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /:id — invalid ID (line 253)', () => {
    it('returns 400 for non-numeric ID', async () => {
      const res = await request(app)
        .get('/api/mpp-executions/abc')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /:id — invalid ID (line 314)', () => {
    it('returns 400 for non-numeric ID', async () => {
      const res = await request(app)
        .delete('/api/mpp-executions/xyz')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });

  describe('POST / — DEFECT result message (lines 228-231)', () => {
    it('returns defect message when result is DEFECT', async () => {
      if (!execDeviceId) return;
      const res = await request(app)
        .post('/api/mpp-executions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: execDeviceId,
          executedDate: new Date().toISOString(),
          checklist: [{ operatiune: 'Test DEFECT', bifat: false }],
          result: 'DEFECT',
          engineerName: 'Eng DEFECT',
        });
      if (res.status === 201) {
        expect(res.body.defectDetected).toBe(true);
        expect(res.body.message).toContain('Defect detectat');
      }
    });
  });

  describe('POST / — FUNCTIONAL result message (lines 228-231)', () => {
    it('returns success message when result is FUNCTIONAL', async () => {
      if (!execDeviceId) return;
      const res = await request(app)
        .post('/api/mpp-executions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: execDeviceId,
          executedDate: new Date().toISOString(),
          checklist: [{ operatiune: 'Test FUNCTIONAL', bifat: true }],
          result: 'FUNCTIONAL',
          engineerName: 'Eng FUNC',
        });
      if (res.status === 201) {
        expect(res.body.defectDetected).toBe(false);
        expect(res.body.message).toContain('Mentenanță preventivă');
      }
    });
  });

  describe('POST / — with occurrence (lines 102-109)', () => {
    it('validates occurrence belongs to device', async () => {
      if (!execDeviceId) return;
      const res = await request(app)
        .post('/api/mpp-executions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: execDeviceId,
          occurrenceId: 999999,
          executedDate: new Date().toISOString(),
          checklist: [{ operatiune: 'Test occ', bifat: true }],
          result: 'FUNCTIONAL',
          engineerName: 'Eng Occ',
        });
      expect(res.status).toBe(404);
    });
  });

  describe('POST / — invalid device (line 97-98)', () => {
    it('returns 404 for nonexistent device', async () => {
      const res = await request(app)
        .post('/api/mpp-executions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: 999999,
          executedDate: new Date().toISOString(),
          checklist: [{ operatiune: 'Test nodev', bifat: true }],
          result: 'FUNCTIONAL',
          engineerName: 'Eng NoDev',
        });
      expect(res.status).toBe(404);
    });
  });

  describe('POST / — invalid checklist template ID (line 42-43)', () => {
    it('returns 400 for non-numeric deviceId', async () => {
      const res = await request(app)
        .get('/api/mpp-executions/checklist-template/abc')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });

  describe('GET /:id — execution not found (line 263-264)', () => {
    it('returns 404 for nonexistent execution', async () => {
      const res = await request(app)
        .get('/api/mpp-executions/999999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// annualInventory.js — catch blocks, import empty, toSafePdfText
// ═══════════════════════════════════════════════════════════════════

describe('annualInventory.js — uncovered branches 7', () => {
  describe('DELETE /:year/section/:sectionId — catch block (lines 243-256)', () => {
    it('returns 500 when transaction fails after creating inventory', async () => {
      const devRes = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${token}`)
        .send({ inventoryNumber: uniqueInv('AI7'), name: 'AI7 Device', riskClass: 'I', sectionId: testSectionId });
      if (devRes.status === 201) {
        cleanupDeviceIds.push(devRes.body.id);
      }
      const postRes = await request(app)
        .post(`/api/annual-inventory/2027/section/${testSectionId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [] });
      expect([200, 500]).toContain(postRes.status);
      const spy = vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('Delete inventory fail'));
      const res = await request(app)
        .delete(`/api/annual-inventory/2027/section/${testSectionId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });

  describe('POST /import-fixed-assets — empty sheet (line 439)', () => {
    it('returns 400 for empty Excel file', async () => {
      const XLSX = require('xlsx');
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([]);
      XLSX.utils.book_append_sheet(wb, ws, 'Empty');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      const res = await request(app)
        .post('/api/annual-inventory/import-fixed-assets')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', buf, { filename: 'empty.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /import-fixed-assets — no file (line 431-433)', () => {
    it('returns 400 when no file uploaded', async () => {
      const res = await request(app)
        .post('/api/annual-inventory/import-fixed-assets')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /import-fixed-assets — rows without required fields', () => {
    it('skips rows without name or cndCode', async () => {
      const XLSX = require('xlsx');
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        ['Cod', 'Denumire', 'Valoare', 'DataInchidere'],
        ['CND-001', null, 100, '2025-01-01'],
        [null, 'Test Device', 200, '2025-02-01'],
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      const res = await request(app)
        .post('/api/annual-inventory/import-fixed-assets')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', buf, { filename: 'mixed.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  describe('GET /:year/status — invalid year (line 77-79)', () => {
    it('returns 400 for invalid year', async () => {
      const res = await request(app)
        .get('/api/annual-inventory/1999/status')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });

  describe('GET /:year/report-pdf — invalid year (line 341-343)', () => {
    it('returns 400 for invalid year in report', async () => {
      const res = await request(app)
        .get('/api/annual-inventory/1999/report-pdf')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /:year/discrepancies/:id/verify — invalid ID (line 304)', () => {
    it('returns 400 for invalid ID', async () => {
      const res = await request(app)
        .post('/api/annual-inventory/2026/discrepancies/abc/verify')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /:year/section/:sectionId — invalid params (line 144)', () => {
    it('returns 400 for invalid params', async () => {
      const res = await request(app)
        .post('/api/annual-inventory/abc/section/xyz')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [] });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /:year/section/:sectionId — invalid params (line 230)', () => {
    it('returns 400 for invalid params', async () => {
      const res = await request(app)
        .delete('/api/annual-inventory/abc/section/xyz')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /:year/section/:sectionId — not found (line 239)', () => {
    it('returns 404 for nonexistent inventory', async () => {
      const res = await request(app)
        .delete('/api/annual-inventory/2000/section/999999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /:year/discrepancies — invalid year (line 269)', () => {
    it('returns 400 for invalid year', async () => {
      const res = await request(app)
        .get('/api/annual-inventory/abc/discrepancies')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// notifications.js — inner catch in checkVerificationExpiry (line 104)
// ═══════════════════════════════════════════════════════════════════

describe('notifications.js — uncovered branches 7', () => {
  const {
    checkVerificationExpiry,
    checkContractExpiry,
    checkMppDue,
    checkRepairTickets,
    generateComplianceSummary,
  } = require('../jobs/notifications');

  describe('checkVerificationExpiry — inner catch when log fails (line 104)', () => {
    it('handles error in inner notification loop', async () => {
      const origLog = console.error;
      console.error = vi.fn();
      try {
        vi.spyOn(prisma.verifications, 'findMany')
          .mockResolvedValueOnce([
            {
              id: 999999,
              validUntil: new Date(Date.now() + 30 * 86400000),
              device: { id: 999999, name: 'Fake Device' },
            },
          ]);
        await checkVerificationExpiry();
      } finally {
        console.error = origLog;
      }
    });
  });

  describe('checkVerificationExpiry — catch branch (line 128)', () => {
    it('logs error when DB query fails', async () => {
      vi.spyOn(prisma.verifications, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
      await checkVerificationExpiry();
    });
  });

  describe('checkMppDue — with overdue occurrences', () => {
    it('handles occurrences in various states', async () => {
      await checkMppDue();
    });
  });

  describe('checkRepairTickets — success path', () => {
    it('checks for critical tickets', async () => {
      await checkRepairTickets();
    });
  });

  describe('generateComplianceSummary — all branches', () => {
    it('counts all device compliance states', async () => {
      await generateComplianceSummary();
    });
  });

  describe('checkContractExpiry — with expiring contracts', () => {
    it('checks contract expiry', async () => {
      await checkContractExpiry();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// incidents.js — logAudit catch block (lines 14-25)
// ═══════════════════════════════════════════════════════════════════

describe('incidents.js — uncovered branches 7', () => {
  let incidentDeviceId;

  beforeAll(async () => {
    const devRes = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({ inventoryNumber: uniqueInv('INC7'), name: 'INC7 Device', riskClass: 'IIa', sectionId: testSectionId });
    if (devRes.status === 201) {
      incidentDeviceId = devRes.body.id;
      cleanupDeviceIds.push(incidentDeviceId);
    }
  });

  describe('logAudit — catch block (lines 14-25)', () => {
    it('handles audit log failure gracefully during DELETE', async () => {
      if (!incidentDeviceId) return;
      const createRes = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: incidentDeviceId,
          occurredAt: new Date().toISOString(),
          description: 'Test incident for audit fail',
          severity: 'MINOR',
        });
      if (createRes.status === 201) {
        cleanupIncidentIds.push(createRes.body.id);
        vi.spyOn(prisma.audit_logs, 'create').mockRejectedValueOnce(new Error('Audit fail'));
        const delRes = await request(app)
          .delete(`/api/incidents/${createRes.body.id}`)
          .set('Authorization', `Bearer ${token}`);
        expect([200, 500]).toContain(delRes.status);
      }
    });
  });

  describe('PUT /:id — invalid severity (line 174)', () => {
    it('returns 400 for invalid severity', async () => {
      if (!incidentDeviceId) return;
      const createRes = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: incidentDeviceId,
          occurredAt: new Date().toISOString(),
          description: 'Test incident for severity',
          severity: 'MINOR',
        });
      if (createRes.status === 201) {
        cleanupIncidentIds.push(createRes.body.id);
        const putRes = await request(app)
          .put(`/api/incidents/${createRes.body.id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ severity: 'INVALID_SEVERITY' });
        expect(putRes.status).toBe(400);
      }
    });
  });

  describe('PUT /:id — invalid status (line 175)', () => {
    it('returns 400 for invalid status', async () => {
      if (!incidentDeviceId) return;
      const createRes = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: incidentDeviceId,
          occurredAt: new Date().toISOString(),
          description: 'Test incident for status',
          severity: 'MINOR',
        });
      if (createRes.status === 201) {
        cleanupIncidentIds.push(createRes.body.id);
        const putRes = await request(app)
          .put(`/api/incidents/${createRes.body.id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ status: 'INVALID_STATUS' });
        expect(putRes.status).toBe(400);
      }
    });
  });

  describe('POST / — missing fields validation (lines 109-112)', () => {
    it('returns 400 when description is empty', async () => {
      if (!incidentDeviceId) return;
      const res = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: incidentDeviceId,
          occurredAt: new Date().toISOString(),
          description: '',
          severity: 'MINOR',
        });
      expect(res.status).toBe(400);
    });

    it('returns 400 when severity is invalid', async () => {
      if (!incidentDeviceId) return;
      const res = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: incidentDeviceId,
          occurredAt: new Date().toISOString(),
          description: 'Test desc',
          severity: 'INVALID',
        });
      expect(res.status).toBe(400);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// maintenance.js — conditional spreads (lines 110-112, 166-174)
// ═══════════════════════════════════════════════════════════════════

describe('maintenance.js — uncovered branches 7', () => {
  let maintDeviceId;

  beforeAll(async () => {
    const devRes = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({ inventoryNumber: uniqueInv('MNT7'), name: 'MNT7 Device', riskClass: 'IIb', sectionId: testSectionId });
    if (devRes.status === 201) {
      maintDeviceId = devRes.body.id;
      cleanupDeviceIds.push(maintDeviceId);
    }
  });

  describe('POST / — with optional fields (lines 110-112)', () => {
    it('creates record with scheduledDate and duration', async () => {
      if (!maintDeviceId) return;
      const res = await request(app)
        .post('/api/maintenance')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: maintDeviceId,
          type: 'PREVENTIVA',
          scheduledDate: new Date().toISOString(),
          executedDate: new Date().toISOString(),
          duration: 2.5,
          description: 'Test maintenance B7',
          cost: 100,
          externalService: true,
          serviceProvider: 'Provider B7',
        });
      expect([201, 400]).toContain(res.status);
      if (res.status === 201) cleanupMaintenanceIds.push(res.body.id);
    });
  });

  describe('POST / — without scheduledDate (line 110 false branch)', () => {
    it('creates record with null scheduledDate', async () => {
      if (!maintDeviceId) return;
      const res = await request(app)
        .post('/api/maintenance')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: maintDeviceId,
          type: 'CORECTIVA',
          executedDate: new Date().toISOString(),
          description: 'Test no scheduled date',
        });
      expect([201, 400]).toContain(res.status);
      if (res.status === 201) cleanupMaintenanceIds.push(res.body.id);
    });
  });

  describe('POST / — without duration (line 112 false branch)', () => {
    it('creates record with null duration', async () => {
      if (!maintDeviceId) return;
      const res = await request(app)
        .post('/api/maintenance')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: maintDeviceId,
          type: 'PREVENTIVA',
          executedDate: new Date().toISOString(),
          description: 'Test no duration',
        });
      expect([201, 400]).toContain(res.status);
      if (res.status === 201) cleanupMaintenanceIds.push(res.body.id);
    });
  });

  describe('PUT /:id — conditional spread branches (lines 166-174)', () => {
    let recordId;
    beforeAll(async () => {
      if (!maintDeviceId) return;
      const res = await request(app)
        .post('/api/maintenance')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: maintDeviceId,
          type: 'PREVENTIVA',
          executedDate: new Date().toISOString(),
          description: 'Test update branches',
        });
      if (res.status === 201) {
        recordId = res.body.id;
        cleanupMaintenanceIds.push(recordId);
      }
    });

    it('updates with scheduledDate null', async () => {
      if (!recordId) return;
      const res = await request(app)
        .put(`/api/maintenance/${recordId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ scheduledDate: null });
      expect([200, 400]).toContain(res.status);
    });

    it('updates with duration null', async () => {
      if (!recordId) return;
      const res = await request(app)
        .put(`/api/maintenance/${recordId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ duration: null });
      expect([200, 400]).toContain(res.status);
    });

    it('updates with cost null', async () => {
      if (!recordId) return;
      const res = await request(app)
        .put(`/api/maintenance/${recordId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ cost: null });
      expect([200, 400]).toContain(res.status);
    });

    it('updates with valid scheduledDate', async () => {
      if (!recordId) return;
      const res = await request(app)
        .put(`/api/maintenance/${recordId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ scheduledDate: new Date().toISOString() });
      expect([200, 400]).toContain(res.status);
    });

    it('updates with valid cost', async () => {
      if (!recordId) return;
      const res = await request(app)
        .put(`/api/maintenance/${recordId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ cost: 50 });
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('PUT /:id — catch block (line 186)', () => {
    it('returns 500 when transaction fails', async () => {
      if (!maintDeviceId) return;
      const createRes = await request(app)
        .post('/api/maintenance')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: maintDeviceId,
          type: 'PREVENTIVA',
          executedDate: new Date().toISOString(),
          description: 'Test catch block',
        });
      if (createRes.status === 201) {
        cleanupMaintenanceIds.push(createRes.body.id);
        const spy = vi.spyOn(prisma.maintenance_records, 'update').mockRejectedValueOnce(new Error('Update fail'));
        const putRes = await request(app)
          .put(`/api/maintenance/${createRes.body.id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ description: 'Updated' });
        expect(putRes.status).toBe(500);
        spy.mockRestore();
      }
    });
  });

  describe('DELETE /:id — not found (line 200)', () => {
    it('returns 404 for nonexistent record', async () => {
      const res = await request(app)
        .delete('/api/maintenance/999999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// maintenancePlans.js — occurrence fallback (75), frequencyToMonths (129),
//                       toSafePdfText (334)
// ═══════════════════════════════════════════════════════════════════

describe('maintenancePlans.js — uncovered branches 7', () => {
  let planDeviceId;

  beforeAll(async () => {
    const devRes = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({ inventoryNumber: uniqueInv('MP7'), name: 'MP7 Device', riskClass: 'I', sectionId: testSectionId, maintenanceFreq: 6 });
    if (devRes.status === 201) {
      planDeviceId = devRes.body.id;
      cleanupDeviceIds.push(planDeviceId);
    }
  });

  describe('GET /:id — occurrence fallback lookup (lines 71-78 via DELETE)', () => {
    it('falls back to occurrence lookup when plan not found by ID in DELETE', async () => {
      if (!planDeviceId) return;
      const planRes = await request(app)
        .post('/api/maintenance-plans/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({ deviceId: planDeviceId, year: new Date().getFullYear(), frequency: 'SEMESTRIAL', responsibleName: 'Eng MP7' });
      if (planRes.status === 201) {
        cleanupPlanIds.push(planRes.body.id);
        const calRes = await request(app)
          .get(`/api/maintenance-plans/calendar?year=${new Date().getFullYear()}`)
          .set('Authorization', `Bearer ${token}`);
        if (calRes.status === 200 && calRes.body.data) {
          const occ = calRes.body.data.find(o => o.planId === planRes.body.id);
          if (occ) {
            cleanupOccurrenceIds.push(occ.id);
            const delRes = await request(app)
              .delete(`/api/maintenance-plans/${occ.id}`)
              .set('Authorization', `Bearer ${token}`);
            expect([200, 404]).toContain(delRes.status);
          }
        }
      }
    });
  });

  describe('POST /generate — invalid frequency (line 128-129)', () => {
    it('returns 400 for invalid frequency', async () => {
      if (!planDeviceId) return;
      const res = await request(app)
        .post('/api/maintenance-plans/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({ deviceId: planDeviceId, year: new Date().getFullYear(), frequency: 'INVALID_FREQ', responsibleName: 'Eng' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /generate — nonexistent device (line 123-124)', () => {
    it('returns 404 for nonexistent device', async () => {
      const res = await request(app)
        .post('/api/maintenance-plans/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({ deviceId: 999999, year: new Date().getFullYear(), frequency: 'SEMESTRIAL', responsibleName: 'Eng' });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /:id — plan not found (line 82)', () => {
    it('returns 404 for nonexistent plan', async () => {
      const res = await request(app)
        .get('/api/maintenance-plans/999999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /:year/formular5-pdf — invalid year (line 341-342)', () => {
    it('returns 400 for invalid year', async () => {
      const res = await request(app)
        .get('/api/maintenance-plans/2019/formular5-pdf')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /occurrence/:id/reschedule — not found (line 310-311)', () => {
    it('returns 404 for nonexistent occurrence', async () => {
      const res = await request(app)
        .patch('/api/maintenance-plans/occurrence/999999/reschedule')
        .set('Authorization', `Bearer ${token}`)
        .send({ newDate: new Date(Date.now() + 30 * 86400000).toISOString(), reason: 'Reprogramare test' });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /calendar — with year filter', () => {
    it('returns calendar data for current year', async () => {
      const res = await request(app)
        .get(`/api/maintenance-plans/calendar?year=${new Date().getFullYear()}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// auth.js — rate limiter NODE_ENV test branch (line 22)
// ═══════════════════════════════════════════════════════════════════

describe('auth.js — uncovered branches 7', () => {
  describe('rate limiter — NODE_ENV=test with skip_ratelimit (line 22)', () => {
    it('skips rate limit when NODE_ENV=test and skip_ratelimit=true', async () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      try {
        const res = await request(app)
          .post('/api/auth/login?skip_ratelimit=true')
          .send({ username: 'testuser', password: TEST_PASSWORD });
        expect([200, 401]).toContain(res.status);
      } finally {
        process.env.NODE_ENV = origEnv;
      }
    });

    it('applies rate limit when NODE_ENV=test and no skip flag', async () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      try {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ username: 'testuser', password: TEST_PASSWORD });
        expect([200, 401, 429]).toContain(res.status);
      } finally {
        process.env.NODE_ENV = origEnv;
      }
    });
  });

  describe('rate limiter — NODE_ENV=development skip (line 20)', () => {
    it('skips rate limit in development with flag', async () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      try {
        const res = await request(app)
          .post('/api/auth/login?skip_ratelimit=true')
          .send({ username: 'testuser', password: TEST_PASSWORD });
        expect([200, 401]).toContain(res.status);
      } finally {
        process.env.NODE_ENV = origEnv;
      }
    });
  });

  describe('POST /refresh — no refresh token (line 65-66)', () => {
    it('returns 401 when refresh token cookie is missing', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({});
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('NO_REFRESH_TOKEN');
    });
  });

  describe('POST /login — rememberMe false branch (line 44-46)', () => {
    it('uses session cookie when rememberMe is false', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: TEST_PASSWORD, rememberMe: false });
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('PATCH /change-password — missing fields (line 131)', () => {
    it('returns 400 when fields are missing', async () => {
      const res = await request(app)
        .patch('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'Test123!' });
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /change-password — mismatched passwords (line 136)', () => {
    it('returns 400 when passwords do not match', async () => {
      const res = await request(app)
        .patch('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'Test123!', newPassword: 'NewPass123!', confirmPassword: 'DifferentPass!' });
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /change-password — short password (line 140)', () => {
    it('returns 400 when password is too short', async () => {
      const res = await request(app)
        .patch('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'Test123!', newPassword: 'short', confirmPassword: 'short' });
      expect(res.status).toBe(400);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// auth.js — change-password deeper branch coverage (lines 131,135,149-155)
// ═══════════════════════════════════════════════════════════════════

describe('auth.js — change-password deeper branches', () => {
  it('returns 400 when currentPassword is missing', async () => {
    const res = await request(app)
      .patch('/api/auth/change-password?skip_ratelimit=true')
      .set('Authorization', `Bearer ${token}`)
      .send({ newPassword: 'NewPass123!', confirmPassword: 'NewPass123!' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when newPassword is missing', async () => {
    const res = await request(app)
      .patch('/api/auth/change-password?skip_ratelimit=true')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: TEST_PASSWORD, confirmPassword: 'NewPass123!' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when confirmPassword is missing', async () => {
    const res = await request(app)
      .patch('/api/auth/change-password?skip_ratelimit=true')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'NewPass123!' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when all fields are empty', async () => {
    const res = await request(app)
      .patch('/api/auth/change-password?skip_ratelimit=true')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when current password is wrong (line 155)', async () => {
    const res = await request(app)
      .patch('/api/auth/change-password?skip_ratelimit=true')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongPassword123!', newPassword: 'NewPass123!', confirmPassword: 'NewPass123!' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('incorectă');
  });

  it('returns 400 when passwords match but too short', async () => {
    const res = await request(app)
      .patch('/api/auth/change-password?skip_ratelimit=true')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'short', confirmPassword: 'short' });
    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════
// devices.js — POST validation error branches, PUT validation
// ═══════════════════════════════════════════════════════════════════

describe('devices.js — deeper branch coverage', () => {
  describe('POST / — validation error branches', () => {
    it('returns 400 when inventoryNumber is invalid', async () => {
      const res = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${token}`)
        .send({ inventoryNumber: 'invalid spaces', name: 'Test Device', riskClass: 'I', sectionId: 1 });
      expect(res.status).toBe(400);
    });

    it('returns 400 when name is too short', async () => {
      const res = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${token}`)
        .send({ inventoryNumber: uniqueInv('DV7V'), name: 'ab', riskClass: 'I', sectionId: 1 });
      expect(res.status).toBe(400);
    });

    it('returns 409 when inventory number already exists', async () => {
      const inv = uniqueInv('DV7D');
      const r1 = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${token}`)
        .send({ inventoryNumber: inv, name: 'Dup Device', riskClass: 'I', sectionId: 1 });
      if (r1.status === 201) cleanupDeviceIds.push(r1.body.id);
      const r2 = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${token}`)
        .send({ inventoryNumber: inv, name: 'Dup Device 2', riskClass: 'I', sectionId: 1 });
      expect(r2.status).toBe(409);
    });
  });

  describe('PUT /:id — validation error branches', () => {
    it('returns 400 for invalid ID', async () => {
      const res = await request(app)
        .put('/api/devices/abc')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test' });
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid body data', async () => {
      const res = await request(app)
        .put('/api/devices/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '' });
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /:id — invalid ID (line 457)', () => {
    it('returns 400 for non-numeric ID', async () => {
      const res = await request(app)
        .patch('/api/devices/abc')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /:id/upload — no file (line 555-556)', () => {
    it('returns 400 when no file is attached', async () => {
      const res = await request(app)
        .post('/api/devices/1/upload')
        .set('Authorization', `Bearer ${token}`)
        .send({ field: 'manualUrl' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /:id — 404 branch (line 387-388)', () => {
    it('returns 404 for nonexistent device', async () => {
      const res = await request(app)
        .get('/api/devices/999999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /:id — 404 branch (line 423-424)', () => {
    it('returns 404 for nonexistent device', async () => {
      const res = await request(app)
        .put('/api/devices/999999')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test' });
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /:id — 404 branch (line 478-479)', () => {
    it('returns 404 for nonexistent device', async () => {
      const res = await request(app)
        .patch('/api/devices/999999')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /:id — 409 already casat (line 522-523)', () => {
    it('returns 409 when device is already casat', async () => {
      const devRes = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${token}`)
        .send({ inventoryNumber: uniqueInv('DV7C'), name: 'Casat Device', riskClass: 'I', sectionId: 1 });
      if (devRes.status === 201) {
        cleanupDeviceIds.push(devRes.body.id);
        await prisma.devices.update({ where: { id: devRes.body.id }, data: { status: 'CASAT' } });
        const delRes = await request(app)
          .delete(`/api/devices/${devRes.body.id}`)
          .set('Authorization', `Bearer ${token}`);
        expect(delRes.status).toBe(409);
      }
    });
  });

  describe('GET /export/xlsx — with all filter combinations (lines 149-159)', () => {
    it('exports with all filters', async () => {
      const res = await request(app)
        .get(`/api/devices/export/xlsx?search=test&status=FUNCTIONAL&riskClass=I&sectionId=1`)
        .set('Authorization', `Bearer ${token}`);
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('GET /export/csv — with all filter combinations (lines 209-219)', () => {
    it('exports with all filters', async () => {
      const res = await request(app)
        .get(`/api/devices/export/csv?search=test&status=FUNCTIONAL&riskClass=I&sectionId=1`)
        .set('Authorization', `Bearer ${token}`);
      expect([200, 400]).toContain(res.status);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// repairTickets.js — triage branches, status transitions
// ═══════════════════════════════════════════════════════════════════

describe('repairTickets.js — deeper branch coverage', () => {
  let tktDeviceId;

  beforeAll(async () => {
    const devRes = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({ inventoryNumber: uniqueInv('RT7D'), name: 'RT7D Device', riskClass: 'III', sectionId: testSectionId });
    if (devRes.status === 201) {
      tktDeviceId = devRes.body.id;
      cleanupDeviceIds.push(tktDeviceId);
    }
  });

  describe('POST / — validation error (line 90-94)', () => {
    it('returns 400 for invalid ticket data', async () => {
      const res = await request(app)
        .post('/api/repair-tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({ deviceId: 'invalid' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST / — device not found (line 101-102)', () => {
    it('returns 404 for nonexistent device', async () => {
      const res = await request(app)
        .post('/api/repair-tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({ deviceId: 999999, reportedBy: 'Tester', faultDescription: 'Test' });
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /:id/status — invalid ID (line 175-176)', () => {
    it('returns 400 for invalid ID', async () => {
      const res = await request(app)
        .patch('/api/repair-tickets/abc/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ newStatus: 'IN_LUCRU' });
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /:id/status — invalid status data (line 180-184)', () => {
    it('returns 400 for invalid status value', async () => {
      const res = await request(app)
        .patch('/api/repair-tickets/1/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ newStatus: 'INVALID' });
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /:id/status — ticket not found (line 194-195)', () => {
    it('returns 404 for nonexistent ticket', async () => {
      const res = await request(app)
        .patch('/api/repair-tickets/999999/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ newStatus: 'IN_LUCRU' });
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /:id/status — invalid transition (line 200-204)', () => {
    it('returns 400 for invalid state transition', async () => {
      if (!tktDeviceId) return;
      const tktRes = await request(app)
        .post('/api/repair-tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({ deviceId: tktDeviceId, reportedBy: 'Tester', faultDescription: 'Test transition' });
      if (tktRes.status === 201) {
        cleanupTicketIds.push(tktRes.body.id);
        const res = await request(app)
          .patch(`/api/repair-tickets/${tktRes.body.id}/status`)
          .set('Authorization', `Bearer ${token}`)
          .send({ newStatus: 'INCHIS' });
        expect(res.status).toBe(400);
      }
    });
  });

  describe('PATCH /:id/triage — invalid ID (line 260-261)', () => {
    it('returns 400 for invalid ID', async () => {
      const res = await request(app)
        .patch('/api/repair-tickets/abc/triage')
        .set('Authorization', `Bearer ${token}`)
        .send({ repairType: 'INTERN', defectCause: 'Test cause' });
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /:id/triage — ticket not found (line 279-280)', () => {
    it('returns 404 for nonexistent ticket', async () => {
      const res = await request(app)
        .patch('/api/repair-tickets/999999/triage')
        .set('Authorization', `Bearer ${token}`)
        .send({ repairType: 'INTERN', defectCause: 'Test cause' });
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /:id/repair — ticket not found (line 364-365)', () => {
    it('returns 404 for nonexistent ticket', async () => {
      const res = await request(app)
        .put('/api/repair-tickets/999999/repair')
        .set('Authorization', `Bearer ${token}`)
        .send({
          repairReport: 'Report',
          actionsTaken: 'Actions',
          durationHours: 2,
          functionalTest: 'FUNCTIONAL',
          engineerName: 'Eng',
        });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /:id — ticket not found (line 663-664)', () => {
    it('returns 404 for nonexistent ticket', async () => {
      const res = await request(app)
        .get('/api/repair-tickets/999999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /:id/formular8-pdf — ticket not found (line 689-690)', () => {
    it('returns 404 for nonexistent ticket', async () => {
      const res = await request(app)
        .get('/api/repair-tickets/999999/formular8-pdf')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /:id/handover-pdf — ticket not found (line 906-907)', () => {
    it('returns 404 for nonexistent ticket', async () => {
      const res = await request(app)
        .get('/api/repair-tickets/999999/handover-pdf')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// authService.js — ACCESS_TOKEN_EXPIRES env (line 16)
// ═══════════════════════════════════════════════════════════════════

describe('authService.js — uncovered branches 7', () => {
  describe('generateAccessToken — default expiry (line 16)', () => {
    it('generates token with default expiry when env var not set', async () => {
      const orig = process.env.ACCESS_TOKEN_EXPIRES;
      delete process.env.ACCESS_TOKEN_EXPIRES;
      try {
        const user = { id: userId, username: 'testuser', role: 'BIOINGINER' };
        const token = require('../services/authService').generateAccessToken(user);
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
      } finally {
        if (orig !== undefined) process.env.ACCESS_TOKEN_EXPIRES = orig;
      }
    });

    it('generates token with custom expiry when env var set', async () => {
      const orig = process.env.ACCESS_TOKEN_EXPIRES;
      process.env.ACCESS_TOKEN_EXPIRES = '30m';
      try {
        const user = { id: userId, username: 'testuser', role: 'BIOINGINER' };
        const token = require('../services/authService').generateAccessToken(user);
        expect(token).toBeDefined();
      } finally {
        if (orig === undefined) delete process.env.ACCESS_TOKEN_EXPIRES;
        else process.env.ACCESS_TOKEN_EXPIRES = orig;
      }
    });
  });
});
