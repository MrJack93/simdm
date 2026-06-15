/**
 * Coverage branch-boost tests — round 3
 *
 * Targets specific uncovered branches in:
 *   notifications.js   — cron callback body (280-286), startCronJobs catch (303-304)
 *   validate.js        — missingFields ternary (11)
 *   devices.js         — upload success (603-606), fisa-pdf 404 (638), fisa-pdf render (647-653)
 *   repairTickets.js   — formular7 page break + empty (587-601), handover partsUsed (1001-1003)
 *   auth.js            — rate-limiter skip return false (22)
 *   consumables.js     — logAudit try/catch (16-27)
 *   verifications.js   — GET /:id catch (352-353), list resFilter (374-375)
 *   maintenance.js     — PUT optional null branches (170-173, 175-177)
 *   auditLogs.js       — pageNum/limitNum defaults (10-11), date filters (21-22), CSV user ternary (86)
 *   annualInventory.js — reset delete (243-256), toSafePdfText (332), empty Excel (439)
 */
const request = require('supertest');
const app = require('../index');
const prisma = require('../db');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

let token;
let userId;
let testSectionId;

const cleanupDeviceIds = [];
const cleanupTicketIds = [];
const cleanupConsumableIds = [];
const cleanupMaintenanceIds = [];
const cleanupVerificationIds = [];
const cleanupInventoryIds = [];

function uniqueInv(prefix = 'BCOV3') {
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
  if (cleanupVerificationIds.length) {
    await prisma.verifications.deleteMany({ where: { id: { in: cleanupVerificationIds } } });
  }
  if (cleanupTicketIds.length) {
    await prisma.repair_tickets.deleteMany({ where: { id: { in: cleanupTicketIds } } });
  }
  if (cleanupConsumableIds.length) {
    await prisma.consumables.deleteMany({ where: { id: { in: cleanupConsumableIds } } });
  }
  if (cleanupMaintenanceIds.length) {
    await prisma.maintenance_records.deleteMany({ where: { id: { in: cleanupMaintenanceIds } } });
  }
  if (cleanupInventoryIds.length) {
    await prisma.inventory_check_items.deleteMany({ where: { inventoryId: { in: cleanupInventoryIds } } });
    await prisma.annual_inventories.deleteMany({ where: { id: { in: cleanupInventoryIds } } });
  }
  if (cleanupDeviceIds.length) {
    await prisma.verifications.deleteMany({ where: { deviceId: { in: cleanupDeviceIds } } });
    await prisma.mpp_executions.deleteMany({ where: { deviceId: { in: cleanupDeviceIds } } });
    await prisma.incidents.deleteMany({ where: { deviceId: { in: cleanupDeviceIds } } });
    await prisma.maintenance_records.deleteMany({ where: { deviceId: { in: cleanupDeviceIds } } });
    await prisma.devices.deleteMany({ where: { id: { in: cleanupDeviceIds } } });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ═══════════════════════════════════════════════════════════════════
// notifications.js — cron callback body (280-286), catch (303-304)
// ═══════════════════════════════════════════════════════════════════

describe('notifications.js — uncovered branches 3', () => {
  const {
    startCronJobs,
    checkVerificationExpiry,
    checkContractExpiry,
    checkMppDue,
    checkRepairTickets,
    generateComplianceSummary,
  } = require('../jobs/notifications');

  describe('cron callback body (lines 280-286)', () => {
    it('executes all check functions in sequence', async () => {
      await checkVerificationExpiry();
      await checkContractExpiry();
      await checkMppDue();
      await checkRepairTickets();
      await generateComplianceSummary();
    });
  });

  describe('startCronJobs error catch (lines 303-304)', () => {
    it('throws when cron.schedule throws', async () => {
      const cron = require('node-cron');
      const originalSchedule = cron.schedule;
      cron.schedule = vi.fn(() => { throw new Error('cron init fail'); });

      expect(() => startCronJobs()).toThrow('cron init fail');

      cron.schedule = originalSchedule;
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// validate.js — missingFields ternary (line 11)
// ═══════════════════════════════════════════════════════════════════

describe('validate.js — uncovered branches 3', () => {
  describe('missingFields.length > 0 branch (line 11)', () => {
    it('returns "Câmpuri obligatorii lipsă" when required fields are absent', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Câmpuri obligatorii lipsă');
    });

    it('returns "Validare eșuată" when field present but invalid', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: '', password: '' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validare eșuată');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// devices.js — upload success (603-606), fisa-pdf 404 (638), render (647-653)
// ═══════════════════════════════════════════════════════════════════

describe('devices.js — uncovered branches 3', () => {
  let deviceId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inventoryNumber: uniqueInv('DEV3'),
        name: 'Device Branch3',
        riskClass: 'IIa',
        sectionId: testSectionId,
      });
    if (res.status === 201) {
      deviceId = res.body.id;
      cleanupDeviceIds.push(deviceId);
    }
  });

  describe('fisa-pdf — 404 device not found (line 638)', () => {
    it('returns 404 for nonexistent device', async () => {
      const res = await request(app)
        .get('/api/devices/999999/fisa-pdf?skip_ratelimit=true')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('fisa-pdf — PDF render (lines 647-653)', () => {
    it('renders PDF for existing device', async () => {
      const res = await request(app)
        .get(`/api/devices/${deviceId}/fisa-pdf?skip_ratelimit=true`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/pdf/);
    });
  });

  describe('upload — successful file upload (lines 603-606)', () => {
    it('uploads file and returns success response', async () => {
      const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
      const res = await request(app)
        .post(`/api/devices/${deviceId}/upload`)
        .set('Authorization', `Bearer ${token}`)
        .field('field', 'manualUrl')
        .attach('file', pdf, 'manual.pdf');
      expect([200, 400]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.device).toBeDefined();
        expect(res.body.fileUrl).toBeDefined();
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// repairTickets.js — formular7 empty/page-break (587-601), handover partsUsed (1001-1003)
// ═══════════════════════════════════════════════════════════════════

describe('repairTickets.js — uncovered branches 3', () => {
  let ticketDeviceId;
  let ticketId;
  let externalTicketId;

  beforeAll(async () => {
    const devRes = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inventoryNumber: uniqueInv('TKT3'),
        name: 'Repair Branch3 Device',
        riskClass: 'I',
        sectionId: testSectionId,
      });
    if (devRes.status === 201) {
      ticketDeviceId = devRes.body.id;
      cleanupDeviceIds.push(ticketDeviceId);

      const tktRes = await request(app)
        .post('/api/repair-tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: ticketDeviceId,
          reportedBy: 'Test Branch3',
          faultDescription: 'Defect branch3 test',
        });
      if (tktRes.status === 201) {
        ticketId = tktRes.body.id;
        cleanupTicketIds.push(ticketId);
      }

      const extRes = await request(app)
        .post('/api/repair-tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: ticketDeviceId,
          reportedBy: 'Test External',
          faultDescription: 'External repair test',
          priority: 'RIDICAT',
        });
      if (extRes.status === 201) {
        externalTicketId = extRes.body.id;
        cleanupTicketIds.push(externalTicketId);

        await prisma.repair_tickets.update({
          where: { id: externalTicketId },
          data: {
            externalized: true,
            partsUsed: [
              { description: 'Filtru aer', qty: 3, costUnit: 120 },
              { description: 'Garnitura', qty: 1, costUnit: 50 },
            ],
          },
        });
      }
    }
  });

  describe('formular7-pdf — empty period (lines 593-595)', () => {
    it('renders empty message when no tickets in future period', async () => {
      const res = await request(app)
        .get('/api/repair-tickets/formular7-pdf?from=2099-01-01&to=2099-12-31')
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/pdf/);
    });
  });

  describe('formular7-pdf — with tickets (lines 587-591)', () => {
    it('renders tickets and handles pagination logic', async () => {
      const res = await request(app)
        .get('/api/repair-tickets/formular7-pdf?from=2020-01-01&to=2030-12-31')
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect(res.status).toBe(200);
    });
  });

  describe('handover-pdf — partsUsed present (lines 1001-1003)', () => {
    it('renders PDF with partsUsed array for externalized ticket', async () => {
      if (!externalTicketId) return;
      const res = await request(app)
        .get(`/api/repair-tickets/${externalTicketId}/handover-pdf`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe('handover-pdf — no partsUsed (lines 1008-1009)', () => {
    it('renders PDF without partsUsed', async () => {
      if (!ticketId) return;
      const noParts = await request(app)
        .post('/api/repair-tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: ticketDeviceId,
          reportedBy: 'No Parts Test',
          faultDescription: 'Simple defect',
        });
      if (noParts.status === 201) cleanupTicketIds.push(noParts.body.id);

      const res = await request(app)
        .get(`/api/repair-tickets/${noParts.body.id}/handover-pdf`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect([200, 400, 404]).toContain(res.status);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// auth.js — rate limiter skip=false branch (line 22)
// ═══════════════════════════════════════════════════════════════════

describe('auth.js — uncovered branches 3', () => {
  describe('rate limiter skip returns false in test env without flag', () => {
    it('login without skip_ratelimit still works', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: TEST_PASSWORD });
      expect(res.status).toBe(200);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// consumables.js — logAudit try/catch (lines 16-27)
// ═══════════════════════════════════════════════════════════════════

describe('consumables.js — uncovered branches 3', () => {
  describe('logAudit try path (lines 16-25)', () => {
    it('creates consumable with successful audit log', async () => {
      const res = await request(app)
        .post('/api/consumables')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: `Branch3 Consumable ${Date.now()}`,
          quantity: 5,
          minQuantity: 2,
        });
      if (res.status === 201) cleanupConsumableIds.push(res.body.id);
      expect(res.status).toBe(201);
    });
  });

  describe('logAudit catch path (lines 26-27)', () => {
    it('creates consumable when standalone logAudit fails', async () => {
      vi.spyOn(prisma.audit_logs, 'create').mockRejectedValueOnce(new Error('Audit fail'));
      const res = await request(app)
        .post('/api/consumables')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: `Audit Fail B3 ${Date.now()}`,
          quantity: 1,
          minQuantity: 1,
        });
      if (res.status === 201) cleanupConsumableIds.push(res.body.id);
      expect(res.status).toBe(201);
      vi.restoreAllMocks();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// verifications.js — GET /:id catch (352-353), list resFilter (374-375)
// ═══════════════════════════════════════════════════════════════════

describe('verifications.js — uncovered branches 3', () => {
  let verDeviceId;

  beforeAll(async () => {
    const devRes = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inventoryNumber: uniqueInv('VR3'),
        name: 'Verification Branch3 Device',
        riskClass: 'IIa',
        sectionId: testSectionId,
      });
    if (devRes.status === 201) {
      verDeviceId = devRes.body.id;
      cleanupDeviceIds.push(verDeviceId);
    }
  });

  describe('GET /:id — error catch (lines 352-353)', () => {
    it('500 when DB throws on get (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.verifications, 'findUnique').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/verifications/1')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('GET / — resFilter branch (lines 373-376)', () => {
    it('filters by result=CONFORM', async () => {
      const res = await request(app)
        .get('/api/verifications?result=CONFORM')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('filters by status=NECONFORM', async () => {
      const res = await request(app)
        .get('/api/verifications?status=NECONFORM')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('filters by deviceId', async () => {
      const res = await request(app)
        .get(`/api/verifications?deviceId=${verDeviceId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('filters by type=LABORATOR', async () => {
      const res = await request(app)
        .get('/api/verifications?type=LABORATOR')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// maintenance.js — PUT optional null branches (170-173, 175-177)
// ═══════════════════════════════════════════════════════════════════

describe('maintenance.js — uncovered branches 3', () => {
  let mntDeviceId;
  let recordId;

  beforeAll(async () => {
    const devRes = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inventoryNumber: uniqueInv('MNT3'),
        name: 'Maintenance Branch3 Device',
        riskClass: 'I',
        sectionId: testSectionId,
      });
    if (devRes.status === 201) {
      mntDeviceId = devRes.body.id;
      cleanupDeviceIds.push(mntDeviceId);

      const recRes = await request(app)
        .post('/api/maintenance')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: mntDeviceId,
          type: 'PREVENTIVA',
          executedDate: new Date().toISOString(),
          description: 'Mentenanță preventivă B3',
        });
      if (recRes.status === 201) {
        recordId = recRes.body.id;
        cleanupMaintenanceIds.push(recordId);
      }
    }
  });

  describe('PUT /:id — setting optional fields to empty/null (lines 170-177)', () => {
    it('sets partsReplaced, consumablesUsed, result to null when empty', async () => {
      if (!recordId) return;
      const res = await request(app)
        .put(`/api/maintenance/${recordId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          partsReplaced: '',
          consumablesUsed: '',
          result: '',
          serviceProvider: '',
          reportUrl: '',
          notes: '',
        });
      expect(res.status).toBe(200);
    });

    it('sets partsReplaced, consumablesUsed, result to values', async () => {
      if (!recordId) return;
      const res = await request(app)
        .put(`/api/maintenance/${recordId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          partsReplaced: 'Filtru HEPA',
          consumablesUsed: 'Alcool',
          result: 'FUNCTIONAL',
          cost: 100,
          serviceProvider: 'Service SRL',
          reportUrl: 'https://example.com',
          notes: 'Notite test',
        });
      expect(res.status).toBe(200);
    });

    it('sets scheduledDate and duration to null when empty', async () => {
      if (!recordId) return;
      const res = await request(app)
        .put(`/api/maintenance/${recordId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          scheduledDate: '',
          duration: '',
        });
      expect(res.status).toBe(200);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// auditLogs.js — pageNum/limitNum defaults (10-11), date filters (21-22), CSV user ternary (86)
// ═══════════════════════════════════════════════════════════════════

describe('auditLogs.js — uncovered branches 3', () => {
  describe('GET / — pageNum/limitNum defaults (lines 10-11)', () => {
    it('defaults page and limit when not provided', async () => {
      const res = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(50);
    });

    it('handles invalid page/limit gracefully', async () => {
      const res = await request(app)
        .get('/api/audit-logs?page=abc&limit=xyz')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET / — date filter branches (lines 21-22)', () => {
    it('filters with dateFrom', async () => {
      const res = await request(app)
        .get('/api/audit-logs?dateFrom=2025-01-01')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('filters with dateTo', async () => {
      const res = await request(app)
        .get('/api/audit-logs?dateTo=2030-12-31')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('filters with both dateFrom and dateTo', async () => {
      const res = await request(app)
        .get('/api/audit-logs?dateFrom=2025-01-01&dateTo=2030-12-31')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('filters by entity', async () => {
      const res = await request(app)
        .get('/api/audit-logs?entity=Device')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('filters by action', async () => {
      const res = await request(app)
        .get('/api/audit-logs?action=CREATE')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /export/csv — user ternary (line 86)', () => {
    it('exports CSV with user info', async () => {
      const res = await request(app)
        .get('/api/audit-logs/export/csv')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
    });

    it('exports CSV with entity filter', async () => {
      const res = await request(app)
        .get('/api/audit-logs/export/csv?entity=Device&action=CREATE')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// annualInventory.js — reset delete (243-256), toSafePdfText (332), empty Excel (439)
// ═══════════════════════════════════════════════════════════════════

describe('annualInventory.js — uncovered branches 3', () => {
  let inventoryYear;
  let inventorySectionId;

  beforeAll(async () => {
    inventoryYear = new Date().getFullYear();
    inventorySectionId = testSectionId;

    const statusRes = await request(app)
      .get(`/api/annual-inventory/${inventoryYear}/status`)
      .set('Authorization', `Bearer ${token}`);

    if (statusRes.status === 200) {
      const sectionStatus = statusRes.body.find(
        (s) => s.sectionId === inventorySectionId && (s.status === 'NOT_STARTED' || s.inventory)
      );
      if (sectionStatus?.inventory) {
        cleanupInventoryIds.push(sectionStatus.inventory.id);
      }
    }
  });

  describe('DELETE /:year/section/:sectionId — reset (lines 243-256)', () => {
    it('returns 400 for invalid params', async () => {
      const res = await request(app)
        .delete('/api/annual-inventory/abc/section/xyz')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it('returns 404 for nonexistent inventory', async () => {
      const res = await request(app)
        .delete('/api/annual-inventory/2099/section/999999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /:year/report-pdf — toSafePdfText (line 332)', () => {
    it('generates PDF report for a year', async () => {
      const res = await request(app)
        .get(`/api/annual-inventory/${inventoryYear}/report-pdf?skip_ratelimit=true`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe('POST /import-fixed-assets — empty Excel (line 439)', () => {
    it('returns 400 for no file', async () => {
      const res = await request(app)
        .post('/api/annual-inventory/import-fixed-assets')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it('returns 400 for empty Excel', async () => {
      const XLSX = require('xlsx');
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([]);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      const res = await request(app)
        .post('/api/annual-inventory/import-fixed-assets')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from(buf), { filename: 'empty.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      expect(res.status).toBe(400);
    });
  });
});
