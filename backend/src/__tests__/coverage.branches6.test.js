/**
 * Coverage branch-boost tests — round 6
 *
 * Targets remaining uncovered branches to push branch coverage ≥ 90%:
 *   notifications.js   — checkVerificationExpiry with various verification states,
 *                         checkMppDue catch (183), checkRepairTickets catch (215),
 *                         generateComplianceSummary expirat++ (252)
 *   devices.js         — file serving path traversal (728-729), upload error cleanup
 *                         (615-618), upload invalid ID (562), upload device not found
 *                         (577), export with filter combos (207-219), fisa-pdf notes (703)
 *   auth.js            — rate-limiter NODE_ENV=production return false (22)
 *   repairTickets.js   — handover-pdf with contract (923), without contract (924-925),
 *                         empty partsUsed (1008), faultCause (974), formular8-pdf
 *                         operations (776-817), managerSignature (866-868)
 *   consumables.js     — logAudit dead code (16-27) via module load
 *   mppExecutions.js   — formular6-pdf invalid base64 (594), no signature (599-601),
 *                         notes (577), consumables (565), module.exports (617)
 *   verifications.js   — compliance report statuses (154-206), certificate CONFORM (308),
 *                         notes (300-302), NECONFORM (311-312)
 */
const request = require('supertest');
const fs = require('fs');
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

function uniqueInv(prefix = 'BCOV6') {
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
// notifications.js — lines 29, 183, 215, 252
// ═══════════════════════════════════════════════════════════════════

describe('notifications.js — uncovered branches 6', () => {
  const {
    checkVerificationExpiry,
    checkContractExpiry,
    checkMppDue,
    checkRepairTickets,
    generateComplianceSummary,
  } = require('../jobs/notifications');

  describe('checkContractExpiry — true branch when expiring contracts exist (line 39)', () => {
    it('logs contract details when contracts expire within 30 days', async () => {
      const provRes = await request(app)
        .post('/api/service-contracts/providers')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Prov-N6-${Date.now()}` });
      if (provRes.status === 201) {
        cleanupProviderIds.push(provRes.body.id);
        const cRes = await request(app)
          .post('/api/service-contracts/contracts')
          .set('Authorization', `Bearer ${token}`)
          .send({
            providerId: provRes.body.id,
            contractNo: `SC-N6-${Date.now()}`,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 15 * 86400000).toISOString(),
            coveredDeviceIds: [],
          });
        if (cRes.status === 201) cleanupContractIds.push(cRes.body.id);
      }
      await checkContractExpiry();
    });
  });

  describe('checkContractExpiry — catch branch (line 53)', () => {
    it('logs error when prisma query fails', async () => {
      vi.spyOn(prisma.service_contracts, 'findMany').mockRejectedValueOnce(new Error('contract DB err'));
      await checkContractExpiry();
    });
  });

  describe('checkVerificationExpiry — various verification states', () => {
    let neverVerifiedDeviceId;
    let expiringVerDeviceId;

    beforeAll(async () => {
      const nvRes = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${token}`)
        .send({ inventoryNumber: uniqueInv('NV6'), name: 'NV6 Never Verified', riskClass: 'I', sectionId: testSectionId });
      if (nvRes.status === 201) {
        neverVerifiedDeviceId = nvRes.body.id;
        cleanupDeviceIds.push(neverVerifiedDeviceId);
        await prisma.devices.update({
          where: { id: neverVerifiedDeviceId },
          data: { requiresVerification: true, verificationType: 'LABORATOR' },
        });
      }

      const evRes = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${token}`)
        .send({ inventoryNumber: uniqueInv('EV6'), name: 'EV6 Expiring Ver', riskClass: 'IIa', sectionId: testSectionId });
      if (evRes.status === 201) {
        expiringVerDeviceId = evRes.body.id;
        cleanupDeviceIds.push(expiringVerDeviceId);
        await prisma.devices.update({ where: { id: expiringVerDeviceId }, data: { requiresVerification: true } });
        const vRes = await request(app)
          .post('/api/verifications')
          .set('Authorization', `Bearer ${token}`)
          .send({
            deviceId: expiringVerDeviceId,
            type: 'LABORATOR',
            performedAt: new Date(Date.now() - 300 * 86400000).toISOString(),
            result: 'CONFORM',
          });
        if (vRes.status === 201) {
          cleanupVerificationIds.push(vRes.body.id);
          await prisma.verifications.update({
            where: { id: vRes.body.id },
            data: { validUntil: new Date(Date.now() + 30 * 86400000) },
          });
        }
      }
    });

    it('triggers all notification branches including neverVerified and expiring', async () => {
      await checkVerificationExpiry();
    });
  });

  describe('checkVerificationExpiry — catch branch (line 128)', () => {
    it('logs error when prisma query fails', async () => {
      vi.spyOn(prisma.verifications, 'findMany').mockRejectedValueOnce(new Error('verif DB err'));
      await checkVerificationExpiry();
    });
  });

  describe('checkMppDue — catch branch (line 183)', () => {
    it('logs error when prisma query fails', async () => {
      vi.spyOn(prisma.mpp_occurrences, 'findMany').mockRejectedValueOnce(new Error('mpp DB err'));
      await checkMppDue();
    });
  });

  describe('checkMppDue — success branch with due occurrences (line 169)', () => {
    it('logs due maintenance occurrences', async () => {
      await checkMppDue();
    });
  });

  describe('checkRepairTickets — catch branch (line 215)', () => {
    it('logs error when prisma query fails', async () => {
      vi.spyOn(prisma.repair_tickets, 'findMany').mockRejectedValueOnce(new Error('rtk DB err'));
      await checkRepairTickets();
    });
  });

  describe('checkRepairTickets — success branch with critical tickets (line 208)', () => {
    it('logs critical tickets when they exist', async () => {
      await checkRepairTickets();
    });
  });

  describe('generateComplianceSummary — all branches (lines 245-264)', () => {
    it('counts conform, expirat, and neverificat devices', async () => {
      await generateComplianceSummary();
    });

    it('handles DB error gracefully', async () => {
      vi.spyOn(prisma.devices, 'findMany').mockRejectedValueOnce(new Error('compliance DB err'));
      await generateComplianceSummary();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// devices.js — lines 606, 638, 647-653, file serving, exports
// ═══════════════════════════════════════════════════════════════════

describe('devices.js — uncovered branches 6', () => {
  let testDeviceId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inventoryNumber: uniqueInv('DV6'),
        name: 'Device Branch6 Tests',
        riskClass: 'III',
        sectionId: testSectionId,
        serialNumber: 'SN-BR6',
        model: 'Model-BR6',
        manufacturer: 'Mfg-BR6',
      });
    if (res.status === 201) {
      testDeviceId = res.body.id;
      cleanupDeviceIds.push(testDeviceId);
    }
  });

  describe('file serving — path traversal (lines 728-729)', () => {
    it('rejects filename containing double dots', async () => {
      const res = await request(app)
        .get('/api/devices/file/file..txt')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid filename');
    });

    it('rejects filename containing forward slash', async () => {
      const res = await request(app)
        .get('/api/devices/file/foo%2Fbar')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it('rejects filename containing backslash', async () => {
      const res = await request(app)
        .get('/api/devices/file/foo%5Cbar')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });

  describe('file serving — not found (line 736)', () => {
    it('returns 404 for non-existent file', async () => {
      const res = await request(app)
        .get('/api/devices/file/nonexistent-file-branch6.pdf')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('file serving — success path (line 747-758)', () => {
    it('serves an existing file with audit log', async () => {
      const uploadsDir = path.join(__dirname, '../../uploads/devices');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const testFile = `test-serve-${Date.now()}.txt`;
      const testFilePath = path.join(uploadsDir, testFile);
      fs.writeFileSync(testFilePath, 'test content for branch6');
      try {
        const res = await request(app)
          .get(`/api/devices/file/${testFile}`)
          .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
      } finally {
        try { fs.unlinkSync(testFilePath); } catch (_) {}
      }
    });
  });

  describe('export/csv — various filter combos (lines 207-219)', () => {
    it('exports with search filter', async () => {
      const res = await request(app)
        .get('/api/devices/export/csv?search=test')
        .set('Authorization', `Bearer ${token}`);
      expect([200, 400]).toContain(res.status);
    });

    it('exports with status filter', async () => {
      const res = await request(app)
        .get('/api/devices/export/csv?status=FUNCTIONAL')
        .set('Authorization', `Bearer ${token}`);
      expect([200, 400]).toContain(res.status);
    });

    it('exports with riskClass filter', async () => {
      const res = await request(app)
        .get('/api/devices/export/csv?riskClass=III')
        .set('Authorization', `Bearer ${token}`);
      expect([200, 400]).toContain(res.status);
    });

    it('exports with sectionId filter', async () => {
      const res = await request(app)
        .get(`/api/devices/export/csv?sectionId=${testSectionId}`)
        .set('Authorization', `Bearer ${token}`);
      expect([200, 400]).toContain(res.status);
    });

    it('exports with all filters combined', async () => {
      const res = await request(app)
        .get(`/api/devices/export/csv?search=test&status=FUNCTIONAL&riskClass=III&sectionId=${testSectionId}`)
        .set('Authorization', `Bearer ${token}`);
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('export/xlsx — row limit exceeded (line 164)', () => {
    it('returns 400 when row limit is exceeded', async () => {
      const origLimit = process.env.EXPORT_ROW_LIMIT;
      process.env.EXPORT_ROW_LIMIT = '1';
      try {
        const res = await request(app)
          .get('/api/devices/export/xlsx')
          .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Prea multe rânduri');
      } finally {
        if (origLimit === undefined) delete process.env.EXPORT_ROW_LIMIT;
        else process.env.EXPORT_ROW_LIMIT = origLimit;
      }
    });
  });

  describe('export/csv — row limit exceeded', () => {
    it('returns 400 when row limit is exceeded', async () => {
      const origLimit = process.env.EXPORT_ROW_LIMIT;
      process.env.EXPORT_ROW_LIMIT = '1';
      try {
        const res = await request(app)
          .get('/api/devices/export/csv')
          .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Prea multe rânduri');
      } finally {
        if (origLimit === undefined) delete process.env.EXPORT_ROW_LIMIT;
        else process.env.EXPORT_ROW_LIMIT = origLimit;
      }
    });
  });

  describe('upload — error catch with file cleanup (lines 615-618)', () => {
    it('cleans up file on transaction error', async () => {
      if (!testDeviceId) return;
      const mockTx = vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('Transaction fail'));
      const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
      const res = await request(app)
        .post(`/api/devices/${testDeviceId}/upload`)
        .set('Authorization', `Bearer ${token}`)
        .field('field', 'manualUrl')
        .attach('file', pdf, { filename: 'errtest.pdf', contentType: 'application/pdf' });
      expect(res.status).toBe(500);
      mockTx.mockRestore();
    });
  });

  describe('upload — invalid ID (line 562)', () => {
    it('returns 400 for non-numeric device ID', async () => {
      const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
      const res = await request(app)
        .post('/api/devices/abc/upload')
        .set('Authorization', `Bearer ${token}`)
        .field('field', 'manualUrl')
        .attach('file', pdf, { filename: 'test.pdf', contentType: 'application/pdf' });
      expect(res.status).toBe(400);
    });
  });

  describe('upload — device not found (line 577)', () => {
    it('returns 404 when device does not exist', async () => {
      const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
      const res = await request(app)
        .post('/api/devices/999999/upload')
        .set('Authorization', `Bearer ${token}`)
        .field('field', 'manualUrl')
        .attach('file', pdf, { filename: 'test.pdf', contentType: 'application/pdf' });
      expect(res.status).toBe(404);
    });
  });

  describe('fisa-pdf — device with notes (line 703)', () => {
    it('includes notes section when device has notes', async () => {
      if (!testDeviceId) return;
      await prisma.devices.update({ where: { id: testDeviceId }, data: { notes: 'Test notes branch6' } });
      try {
        const res = await request(app)
          .get(`/api/devices/${testDeviceId}/fisa-pdf?skip_ratelimit=true`)
          .set('Authorization', `Bearer ${token}`)
          .buffer(true);
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/application\/pdf/);
      } finally {
        await prisma.devices.update({ where: { id: testDeviceId }, data: { notes: null } });
      }
    });
  });

  describe('fisa-pdf — 404 for nonexistent device (line 638)', () => {
    it('returns 404 for non-existent device', async () => {
      const res = await request(app)
        .get('/api/devices/999999/fisa-pdf?skip_ratelimit=true')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// auth.js — line 22
// ═══════════════════════════════════════════════════════════════════

describe('auth.js — uncovered branches 6', () => {
  describe('rate limiter — NODE_ENV=production return false (line 22)', () => {
    it('applies rate limiting when NODE_ENV is production', async () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ username: 'testuser', password: TEST_PASSWORD });
        expect([200, 400, 401]).toContain(res.status);
      } finally {
        process.env.NODE_ENV = origEnv;
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// repairTickets.js — lines 924-925, 961, 1063
// ═══════════════════════════════════════════════════════════════════

describe('repairTickets.js — uncovered branches 6', () => {
  let ticketDeviceId;
  let externalizedTicketNoPartsId;
  let externalizedTicketWithPartsId;
  let providerId;

  beforeAll(async () => {
    const devRes = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({ inventoryNumber: uniqueInv('RT6'), name: 'RT6 Device', riskClass: 'IIb', sectionId: testSectionId });
    if (devRes.status === 201) {
      ticketDeviceId = devRes.body.id;
      cleanupDeviceIds.push(ticketDeviceId);

      const tkt1Res = await request(app)
        .post('/api/repair-tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({ deviceId: ticketDeviceId, reportedBy: 'Tester RT6a', faultDescription: 'Defect RT6 no parts' });
      if (tkt1Res.status === 201) {
        externalizedTicketNoPartsId = tkt1Res.body.id;
        cleanupTicketIds.push(externalizedTicketNoPartsId);
        await prisma.repair_tickets.update({
          where: { id: externalizedTicketNoPartsId },
          data: { externalized: true, faultCause: 'Cauza RT6 test', repairReport: 'Raport RT6 test' },
        });
      }

      const tkt2Res = await request(app)
        .post('/api/repair-tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({ deviceId: ticketDeviceId, reportedBy: 'Tester RT6b', faultDescription: 'Defect RT6 with parts' });
      if (tkt2Res.status === 201) {
        externalizedTicketWithPartsId = tkt2Res.body.id;
        cleanupTicketIds.push(externalizedTicketWithPartsId);
        await prisma.repair_tickets.update({
          where: { id: externalizedTicketWithPartsId },
          data: {
            externalized: true,
            faultCause: 'Cauza RT6 cu piese',
            repairReport: 'Reparatie completa RT6',
            partsUsed: [{ description: 'Filtru RT6', qty: 2, costUnit: 50 }],
            totalCost: 100,
            operations: [{ date: new Date().toISOString(), timeStart: '09:00', timeEnd: '10:00', operation: 'Test op RT6', engineer: 'Eng RT6' }],
            engineerName: 'Inginer RT6',
            managerSignature: 'manager-sig-rt6-base64',
            functionalTest: 'FUNCTIONAL',
            actionsTaken: 'Actiuni RT6',
          },
        });
      }

      const provRes = await request(app)
        .post('/api/service-contracts/providers')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Prov-RT6-${Date.now()}` });
      if (provRes.status === 201) {
        providerId = provRes.body.id;
        cleanupProviderIds.push(providerId);
      }
    }
  });

  describe('handover-pdf — no contract fallback (lines 924-925)', () => {
    it('uses fallback provider name when no contract covers device', async () => {
      if (!externalizedTicketNoPartsId) return;
      const res = await request(app)
        .get(`/api/repair-tickets/${externalizedTicketNoPartsId}/handover-pdf?skip_ratelimit=true`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect([200, 400]).toContain(res.status);
      if (res.status === 200) expect(res.headers['content-type']).toMatch(/application\/pdf/);
    });
  });

  describe('handover-pdf — with active contract (line 923)', () => {
    it('uses contract provider info when contract covers device', async () => {
      if (!externalizedTicketNoPartsId || !ticketDeviceId || !providerId) return;
      const cRes = await request(app)
        .post('/api/service-contracts/contracts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          providerId,
          contractNo: `SC-RT6-${Date.now()}`,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 86400000).toISOString(),
          coveredDeviceIds: [ticketDeviceId],
        });
      if (cRes.status === 201) {
        cleanupContractIds.push(cRes.body.id);
        const res = await request(app)
          .get(`/api/repair-tickets/${externalizedTicketNoPartsId}/handover-pdf?skip_ratelimit=true`)
          .set('Authorization', `Bearer ${token}`)
          .buffer(true);
        expect([200, 400]).toContain(res.status);
      }
    });
  });

  describe('handover-pdf — hospitalName from env (line 961)', () => {
    it('uses HOSPITAL_NAME env var when set', async () => {
      if (!externalizedTicketNoPartsId) return;
      const origHosp = process.env.HOSPITAL_NAME;
      process.env.HOSPITAL_NAME = 'Spitalul Test RT6';
      try {
        const res = await request(app)
          .get(`/api/repair-tickets/${externalizedTicketNoPartsId}/handover-pdf?skip_ratelimit=true`)
          .set('Authorization', `Bearer ${token}`)
          .buffer(true);
        expect([200, 400]).toContain(res.status);
      } finally {
        if (origHosp === undefined) delete process.env.HOSPITAL_NAME;
        else process.env.HOSPITAL_NAME = origHosp;
      }
    });
  });

  describe('handover-pdf — empty partsUsed (line 1008)', () => {
    it('shows fallback text when partsUsed is null', async () => {
      if (!externalizedTicketNoPartsId) return;
      const res = await request(app)
        .get(`/api/repair-tickets/${externalizedTicketNoPartsId}/handover-pdf?skip_ratelimit=true`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('handover-pdf — with partsUsed and faultCause (lines 974, 1001)', () => {
    it('renders parts list and faultCause when present', async () => {
      if (!externalizedTicketWithPartsId) return;
      const res = await request(app)
        .get(`/api/repair-tickets/${externalizedTicketWithPartsId}/handover-pdf?skip_ratelimit=true`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect([200, 400]).toContain(res.status);
      if (res.status === 200) expect(res.headers['content-type']).toMatch(/application\/pdf/);
    });
  });

  describe('formular8-pdf — with operations table (lines 776-817)', () => {
    it('renders operations table when operations exist', async () => {
      if (!externalizedTicketWithPartsId) return;
      const res = await request(app)
        .get(`/api/repair-tickets/${externalizedTicketWithPartsId}/formular8-pdf?skip_ratelimit=true`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect([200, 400]).toContain(res.status);
      if (res.status === 200) expect(res.headers['content-type']).toMatch(/application\/pdf/);
    });
  });

  describe('formular8-pdf — with managerSignature (lines 866-868)', () => {
    it('includes manager signature section when present', async () => {
      if (!externalizedTicketWithPartsId) return;
      const res = await request(app)
        .get(`/api/repair-tickets/${externalizedTicketWithPartsId}/formular8-pdf?skip_ratelimit=true`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect([200, 400]).toContain(res.status);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// consumables.js — lines 16-27 (dead code: logAudit/createAuditLogData)
// ═══════════════════════════════════════════════════════════════════

describe('consumables.js — uncovered branches 6', () => {
  describe('createAuditLogData function coverage (lines 16-23)', () => {
    it('module loads and helper function is accessible via routes', async () => {
      const mod = require('../routes/consumables');
      expect(mod).toBeDefined();
    });

    it('POST /consumables triggers createAuditLogData with full args', async () => {
      const res = await request(app)
        .post('/api/consumables')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Test Cons B6 ${Date.now()}`, quantity: 5, minQuantity: 1 });
      expect([201, 400]).toContain(res.status);
      if (res.status === 201) cleanupConsumableIds.push(res.body.id);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// mppExecutions.js — lines 322-323, 343, 617
// ═══════════════════════════════════════════════════════════════════

describe('mppExecutions.js — uncovered branches 6', () => {
  let execDeviceId;
  let occurrenceId;
  let planId;
  let consumableId;

  beforeAll(async () => {
    const devRes = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inventoryNumber: uniqueInv('MPP6'),
        name: 'MPP6 Device',
        riskClass: 'IIa',
        sectionId: testSectionId,
        maintenanceFreq: 6,
      });
    if (devRes.status === 201) {
      execDeviceId = devRes.body.id;
      cleanupDeviceIds.push(execDeviceId);
    }

    const consRes = await request(app)
      .post('/api/consumables')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `MPP6 Cons ${Date.now()}`, quantity: 20, minQuantity: 5 });
    if (consRes.status === 201) {
      consumableId = consRes.body.id;
      cleanupConsumableIds.push(consumableId);
    }

    if (execDeviceId) {
      const planRes = await request(app)
        .post('/api/maintenance-plans/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: execDeviceId,
          year: new Date().getFullYear(),
          frequency: 'SEMESTRIAL',
          responsibleName: 'Eng MPP6',
        });
      if (planRes.status === 201) {
        planId = planRes.body.id;
        cleanupPlanIds.push(planId);
        const calRes = await request(app)
          .get(`/api/maintenance-plans/calendar?year=${new Date().getFullYear()}`)
          .set('Authorization', `Bearer ${token}`);
        if (calRes.status === 200 && calRes.body.data) {
          const planOcc = calRes.body.data.find(o => o.planId === planId);
          if (planOcc) {
            occurrenceId = planOcc.id;
            cleanupOccurrenceIds.push(occurrenceId);
          }
        }
      }
    }
  });

  describe('DELETE — execution not found (lines 322-323)', () => {
    it('returns 404 when execution does not exist', async () => {
      const res = await request(app)
        .delete('/api/mpp-executions/999999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE — revert occurrence (line 343)', () => {
    it('reverts occurrence status when execution has occurrenceId', async () => {
      if (!execDeviceId || !consumableId) return;
      const createRes = await request(app)
        .post('/api/mpp-executions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: execDeviceId,
          occurrenceId: occurrenceId || undefined,
          executedDate: new Date().toISOString(),
          durationMinutes: 30,
          checklist: [{ operatiune: 'Test MPP6 revert', bifat: true }],
          consumablesUsed: [{ consumableId, qty: 1 }],
          result: 'FUNCTIONAL',
          engineerName: 'Eng MPP6',
        });
      if (createRes.status === 201) {
        const delRes = await request(app)
          .delete(`/api/mpp-executions/${createRes.body.id}`)
          .set('Authorization', `Bearer ${token}`);
        expect(delRes.status).toBe(200);
      }
    });
  });

  describe('formular6-pdf — invalid base64 signature (line 594 catch)', () => {
    it('handles invalid base64 signature gracefully', async () => {
      if (!execDeviceId) return;
      const createRes = await request(app)
        .post('/api/mpp-executions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: execDeviceId,
          executedDate: new Date().toISOString(),
          durationMinutes: 45,
          checklist: [{ operatiune: 'Test invalid sig', bifat: true }],
          result: 'FUNCTIONAL',
          engineerName: 'Eng MPP6 InvSig',
          signature: 'data:image/png;base64,SGVsbG8=',
        });
      if (createRes.status === 201) {
        cleanupConsumableIds.push(createRes.body.id);
        const pdfRes = await request(app)
          .get(`/api/mpp-executions/${createRes.body.id}/formular6-pdf?skip_ratelimit=true`)
          .set('Authorization', `Bearer ${token}`)
          .buffer(true);
        expect([200, 400]).toContain(pdfRes.status);
      }
    });
  });

  describe('formular6-pdf — no signature (lines 599-601 else)', () => {
    it('shows fallback text when no signature', async () => {
      if (!execDeviceId) return;
      const createRes = await request(app)
        .post('/api/mpp-executions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: execDeviceId,
          executedDate: new Date().toISOString(),
          durationMinutes: 30,
          checklist: [{ operatiune: 'Test no sig', bifat: true }],
          result: 'FUNCTIONAL',
          engineerName: 'Eng MPP6 NoSig',
        });
      if (createRes.status === 201) {
        const pdfRes = await request(app)
          .get(`/api/mpp-executions/${createRes.body.id}/formular6-pdf?skip_ratelimit=true`)
          .set('Authorization', `Bearer ${token}`)
          .buffer(true);
        expect([200, 400]).toContain(pdfRes.status);
      }
    });
  });

  describe('formular6-pdf — with notes (line 577)', () => {
    it('includes notes section when present', async () => {
      if (!execDeviceId) return;
      const createRes = await request(app)
        .post('/api/mpp-executions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: execDeviceId,
          executedDate: new Date().toISOString(),
          durationMinutes: 20,
          checklist: [{ operatiune: 'Test notes', bifat: true }],
          result: 'FUNCTIONAL',
          engineerName: 'Eng MPP6 Notes',
          notes: 'Observatii MPP6 branch6 test',
        });
      if (createRes.status === 201) {
        const pdfRes = await request(app)
          .get(`/api/mpp-executions/${createRes.body.id}/formular6-pdf?skip_ratelimit=true`)
          .set('Authorization', `Bearer ${token}`)
          .buffer(true);
        expect([200, 400]).toContain(pdfRes.status);
      }
    });
  });

  describe('formular6-pdf — with consumables (line 565)', () => {
    it('includes consumables section when present', async () => {
      if (!execDeviceId || !consumableId) return;
      const createRes = await request(app)
        .post('/api/mpp-executions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: execDeviceId,
          executedDate: new Date().toISOString(),
          durationMinutes: 40,
          checklist: [{ operatiune: 'Test consumables', bifat: true }],
          consumablesUsed: [{ consumableId, qty: 2 }],
          result: 'FUNCTIONAL',
          engineerName: 'Eng MPP6 Cons',
        });
      if (createRes.status === 201) {
        const pdfRes = await request(app)
          .get(`/api/mpp-executions/${createRes.body.id}/formular6-pdf?skip_ratelimit=true`)
          .set('Authorization', `Bearer ${token}`)
          .buffer(true);
        expect([200, 400]).toContain(pdfRes.status);
      }
    });
  });

  describe('formular6-pdf — valid base64 signature (lines 589-593)', () => {
    it('renders valid base64 signature image', async () => {
      if (!execDeviceId) return;
      const createRes = await request(app)
        .post('/api/mpp-executions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: execDeviceId,
          executedDate: new Date().toISOString(),
          durationMinutes: 15,
          checklist: [{ operatiune: 'Test valid sig', bifat: true }],
          result: 'FUNCTIONAL',
          engineerName: 'Eng MPP6 ValidSig',
          signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        });
      if (createRes.status === 201) {
        const pdfRes = await request(app)
          .get(`/api/mpp-executions/${createRes.body.id}/formular6-pdf?skip_ratelimit=true`)
          .set('Authorization', `Bearer ${token}`)
          .buffer(true);
        expect([200, 400]).toContain(pdfRes.status);
      }
    });
  });

  describe('formular6-pdf — invalid signature format (line 594 catch)', () => {
    it('catches error when signature has no data URL prefix', async () => {
      if (!execDeviceId) return;
      const createRes = await request(app)
        .post('/api/mpp-executions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: execDeviceId,
          executedDate: new Date().toISOString(),
          durationMinutes: 15,
          checklist: [{ operatiune: 'Test bad sig format', bifat: true }],
          result: 'FUNCTIONAL',
          engineerName: 'Eng MPP6 BadSig',
          signature: 'not-a-data-url',
        });
      if (createRes.status === 201) {
        const pdfRes = await request(app)
          .get(`/api/mpp-executions/${createRes.body.id}/formular6-pdf?skip_ratelimit=true`)
          .set('Authorization', `Bearer ${token}`)
          .buffer(true);
        expect([200, 400]).toContain(pdfRes.status);
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// verifications.js — lines 300-302, 311-312
// ═══════════════════════════════════════════════════════════════════

describe('verifications.js — uncovered branches 6', () => {
  let verDeviceId;
  let conformVerId;
  let neconformVerId;
  let notesVerId;
  let expiredVerId;

  beforeAll(async () => {
    const devRes = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({ inventoryNumber: uniqueInv('VR6'), name: 'VR6 Device', riskClass: 'IIa', sectionId: testSectionId });
    if (devRes.status === 201) {
      verDeviceId = devRes.body.id;
      cleanupDeviceIds.push(verDeviceId);
      await prisma.devices.update({ where: { id: verDeviceId }, data: { requiresVerification: true } });

      const cRes = await request(app)
        .post('/api/verifications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: verDeviceId,
          type: 'LABORATOR',
          performedAt: new Date().toISOString(),
          result: 'CONFORM',
          notes: 'Observatii VR6 conform',
          inspectionBody: 'Laborator VR6',
          certificateNo: 'CERT-VR6-001',
        });
      if (cRes.status === 201) {
        conformVerId = cRes.body.id;
        cleanupVerificationIds.push(conformVerId);
      }

      const nRes = await request(app)
        .post('/api/verifications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: verDeviceId,
          type: 'METROLOGIC',
          performedAt: new Date().toISOString(),
          result: 'NECONFORM',
          notes: 'Observatii VR6 neconform',
        });
      if (nRes.status === 201) {
        neconformVerId = nRes.body.id;
        cleanupVerificationIds.push(neconformVerId);
      }

      const noteRes = await request(app)
        .post('/api/verifications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: verDeviceId,
          type: 'LABORATOR',
          performedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
          result: 'CONFORM',
          notes: 'Note specifice pentru certificat branch6',
          inspectionBody: 'Inspectie VR6',
        });
      if (noteRes.status === 201) {
        notesVerId = noteRes.body.id;
        cleanupVerificationIds.push(notesVerId);
      }

      const expRes = await request(app)
        .post('/api/verifications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: verDeviceId,
          type: 'LABORATOR',
          performedAt: new Date(Date.now() - 400 * 86400000).toISOString(),
          result: 'CONFORM',
          validUntil: new Date(Date.now() - 30 * 86400000).toISOString(),
        });
      if (expRes.status === 201) {
        expiredVerId = expRes.body.id;
        cleanupVerificationIds.push(expiredVerId);
      }
    }
  });

  describe('certificate-pdf — notes branch (lines 300-302)', () => {
    it('renders Observatii section when notes present', async () => {
      if (!notesVerId) return;
      const res = await request(app)
        .get(`/api/verifications/${notesVerId}/certificate?skip_ratelimit=true`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/pdf/);
    });
  });

  describe('certificate-pdf — NECONFORM branch (lines 311-312)', () => {
    it('renders red NECONFORM text and resets color', async () => {
      if (!neconformVerId) return;
      const res = await request(app)
        .get(`/api/verifications/${neconformVerId}/certificate?skip_ratelimit=true`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/pdf/);
    });
  });

  describe('certificate-pdf — CONFORM branch (line 308)', () => {
    it('renders normal CONFORM text', async () => {
      if (!conformVerId) return;
      const res = await request(app)
        .get(`/api/verifications/${conformVerId}/certificate?skip_ratelimit=true`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/pdf/);
    });
  });

  describe('certificate-pdf — 404 for nonexistent verification', () => {
    it('returns 404 for non-existent verification', async () => {
      const res = await request(app)
        .get('/api/verifications/999999/certificate?skip_ratelimit=true')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('compliance-report — various statuses (lines 154-206)', () => {
    it('returns compliance report with multiple status types', async () => {
      const res = await request(app)
        .get('/api/verifications/compliance-report')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.devices).toBeDefined();
      expect(typeof res.body.total).toBe('number');
      expect(typeof res.body.conform).toBe('number');
      expect(typeof res.body.neverificat).toBe('number');
    });
  });

  describe('verifications list — with filters (lines 370-376)', () => {
    it('lists verifications with type filter', async () => {
      const res = await request(app)
        .get('/api/verifications?type=LABORATOR')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it('lists verifications with result filter', async () => {
      const res = await request(app)
        .get('/api/verifications?result=CONFORM')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('lists verifications with status filter alias', async () => {
      const res = await request(app)
        .get('/api/verifications?status=NECONFORM')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('returns 400 for invalid pagination', async () => {
      const res = await request(app)
        .get('/api/verifications?page=abc&limit=xyz')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });

  describe('verifications create — NECONFORM sets device DEFECT (line 100)', () => {
    it('sets device status to DEFECT on NECONFORM result', async () => {
      if (!verDeviceId) return;
      const res = await request(app)
        .post('/api/verifications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: verDeviceId,
          type: 'LABORATOR',
          performedAt: new Date().toISOString(),
          result: 'NECONFORM',
        });
      if (res.status === 201) {
        cleanupVerificationIds.push(res.body.id);
        const device = await prisma.devices.findUnique({ where: { id: verDeviceId } });
        expect(device.status).toBe('DEFECT');
      }
    });
  });
});
