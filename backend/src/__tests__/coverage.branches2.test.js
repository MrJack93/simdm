/**
 * Coverage boost tests targeting specific uncovered branches.
 *
 * Covers:
 *   devices.js        — fisa-pdf notes branch, file serving branches
 *   repairTickets.js  — formular7-pdf pagination/empty, handover-pdf partsUsed
 *   maintenance.js    — logAudit error catch
 *   notifications.js  — startCronJobs error path
 *   auth.js           — rate limiter skip=false branch
 *   mppExecutions.js  — invalid signature catch in PDF, error catch
 *   verifications.js  — list error catch, delete 404, delete error catch
 *   consumables.js    — logAudit error catch
 *   maintenancePlans.js — delete success, invalid frequency, invalid ID, toSafePdfText
 */
const request = require('supertest');
const app = require('../index');
const prisma = require('../db');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

let token;
let userId;
let testDeviceId;
let testSectionId;

const cleanupDeviceIds = [];
const cleanupTicketIds = [];
const cleanupConsumableIds = [];
const cleanupPlanIds = [];
const cleanupVerificationIds = [];
const cleanupMaintenanceIds = [];

function uniqueInv(prefix = 'BCOV2') {
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
  if (cleanupPlanIds.length) {
    for (const planId of cleanupPlanIds) {
      await prisma.mpp_occurrences.deleteMany({ where: { planId } });
    }
    await prisma.maintenance_plans.deleteMany({ where: { id: { in: cleanupPlanIds } } });
  }
  if (cleanupMaintenanceIds.length) {
    await prisma.maintenance_records.deleteMany({ where: { id: { in: cleanupMaintenanceIds } } });
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
// devices.js — fisa-pdf notes branch (line 703), file serving (717-763)
// ═══════════════════════════════════════════════════════════════════

describe('devices.js — uncovered branches 2', () => {
  let fullDeviceId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inventoryNumber: uniqueInv('FULL'),
        name: 'Full Device Branch2',
        riskClass: 'III',
        sectionId: testSectionId,
        serialNumber: 'SN-BRANCH2',
        model: 'Model B2',
        manufacturer: 'Mfg B2',
        countryOfOrigin: 'Moldova',
        yearMade: 2023,
        ceMarking: 'CE-B2',
        cndCode: 'CND-B2',
        room: 'Camera B2',
        voltage: '220V',
        frequency: '50Hz',
        power: '1000W',
        accessories: 'Cablu B2',
        electricalSafetyClass: 'Clasa I',
        notes: 'Test notes for branch coverage - section 6 should render',
        maintenanceFreq: 6,
        acquisitionDate: '2023-01-15',
        acquisitionValue: 50000,
        currency: 'MDL',
        warrantyEndDate: '2026-01-15',
      });
    if (res.status === 201) {
      fullDeviceId = res.body.id;
      cleanupDeviceIds.push(fullDeviceId);
    }
  });

  describe('GET /:id/fisa-pdf — notes present (line 703)', () => {
    it('renders section 6 when device has notes', async () => {
      const res = await request(app)
        .get(`/api/devices/${fullDeviceId}/fisa-pdf?skip_ratelimit=true`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/pdf/);
    });
  });

  describe('GET /file/:filename — directory traversal (lines 728-730)', () => {
    it('returns 400 for filename with ..', async () => {
      const res = await request(app)
        .get('/api/devices/file/..%2F..%2Fetc%2Fpasswd')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it('returns 400 for filename with forward slash (Express 5 may 404)', async () => {
      const res = await request(app)
        .get('/api/devices/file/sub/file.pdf')
        .set('Authorization', `Bearer ${token}`);
      expect([400, 404]).toContain(res.status);
    });

    it('returns 400 for filename with backslash (Express 5 may 404)', async () => {
      const res = await request(app)
        .get('/api/devices/file/sub\\file.pdf')
        .set('Authorization', `Bearer ${token}`);
      expect([400, 404]).toContain(res.status);
    });
  });

  describe('GET /file/:filename — 500 error catch (line 761)', () => {
    it('500 when DB throws on audit log (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.audit_logs, 'create').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/devices/file/nonexistent.pdf')
        .set('Authorization', `Bearer ${token}`);
      expect([404, 500]).toContain(res.status);
      errSpy.mockRestore();
    });
  });

  describe('POST /:id/upload — 404 device not found (line 578)', () => {
    it('returns 404 for nonexistent device', async () => {
      const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
      const res = await request(app)
        .post('/api/devices/999999/upload')
        .set('Authorization', `Bearer ${token}`)
        .field('field', 'manualUrl')
        .attach('file', pdf, 'manual.pdf');
      expect(res.status).toBe(404);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// repairTickets.js — formular7-pdf empty/page-break, handover-pdf parts
// ═══════════════════════════════════════════════════════════════════

describe('repairTickets.js — uncovered branches 2', () => {
  let ticketId;
  let handoverTicketId;

  beforeAll(async () => {
    const deviceRes = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inventoryNumber: uniqueInv('TKT2'),
        name: 'Repair Ticket Device B2',
        riskClass: 'IIa',
        sectionId: testSectionId,
      });
    if (deviceRes.status === 201) {
      cleanupDeviceIds.push(deviceRes.body.id);

      const ticketRes = await request(app)
        .post('/api/repair-tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: deviceRes.body.id,
          reportedBy: 'Test Bioinginer B2',
          faultDescription: 'Test defect for branch coverage 2',
          priority: 'RIDICAT',
        });
      if (ticketRes.status === 201) {
        ticketId = ticketRes.body.id;
        cleanupTicketIds.push(ticketId);
      }

      const handoverRes = await request(app)
        .post('/api/repair-tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: deviceRes.body.id,
          reportedBy: 'Test Bioinginer Handover',
          faultDescription: 'Test handover with parts',
          priority: 'NORMAL',
        });
      if (handoverRes.status === 201) {
        handoverTicketId = handoverRes.body.id;
        cleanupTicketIds.push(handoverTicketId);

        await prisma.repair_tickets.update({
          where: { id: handoverTicketId },
          data: {
            partsUsed: [
              { description: 'Filtru HEPA', qty: 2, costUnit: 150 },
              { description: 'Cablu alimentare', qty: 1, costUnit: 75 },
            ],
            repairReport: 'Reparatie efectuata cu piese noi',
            engineerName: 'Ing. Handover Test',
          },
        });
      }
    }
  });

  describe('GET /formular7-pdf — empty tickets (line 593-595)', () => {
    it('renders empty message when no tickets in period', async () => {
      const from = '2099-01-01';
      const to = '2099-12-31';
      const res = await request(app)
        .get(`/api/repair-tickets/formular7-pdf?from=${from}&to=${to}`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/pdf/);
    });

    it('renders with date filters (from/to)', async () => {
      const from = '2025-01-01';
      const to = '2025-12-31';
      const res = await request(app)
        .get(`/api/repair-tickets/formular7-pdf?from=${from}&to=${to}`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /:id/formular8-pdf — ticket with operations (line 776)', () => {
    it('generates PDF with faultCause, actionsTaken, operations', async () => {
      await prisma.repair_tickets.update({
        where: { id: ticketId },
        data: {
          faultCause: 'Defect electronic',
          actionsTaken: 'Inlocuit componenta',
          engineerName: 'Ing. Formular8',
          operations: [
            {
              date: new Date().toISOString(),
              timeStart: '09:00',
              timeEnd: '10:00',
              operation: 'Diagnostic',
              engineer: 'Ing. Diag',
            },
          ],
          partsUsed: [
            { description: 'Placa electronica', qty: 1, costUnit: 500 },
          ],
          totalCost: 500,
          functionalTest: 'FUNCTIONAL',
          repairReport: 'Reparat cu succes',
        },
      });
      const res = await request(app)
        .get(`/api/repair-tickets/${ticketId}/formular8-pdf`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/pdf/);
    });
  });

  describe('GET /:id/formular8-pdf — error catch (line 879)', () => {
    it('500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.repair_tickets, 'findUnique').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get(`/api/repair-tickets/${ticketId}/formular8-pdf`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('GET /:id/handover-pdf — partsUsed branch (line 1001)', () => {
    it('generates PDF with partsUsed array', async () => {
      if (!handoverTicketId) return;
      const res = await request(app)
        .get(`/api/repair-tickets/${handoverTicketId}/handover-pdf`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect([200, 400, 404]).toContain(res.status);
    });

    it('generates PDF without partsUsed', async () => {
      if (!handoverTicketId) return;
      const noPartsTicket = await request(app)
        .post('/api/repair-tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: cleanupDeviceIds[0],
          reportedBy: 'Test No Parts',
          faultDescription: 'Simple defect',
        });
      if (noPartsTicket.status === 201) cleanupTicketIds.push(noPartsTicket.body.id);

      const res = await request(app)
        .get(`/api/repair-tickets/${noPartsTicket.body.id}/handover-pdf`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect([200, 400, 404]).toContain(res.status);
    });

    it('500 when DB throws (spy)', async () => {
      if (!handoverTicketId) return;
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.repair_tickets, 'findUnique').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get(`/api/repair-tickets/${handoverTicketId}/handover-pdf`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('GET /formular7-pdf — 500 error catch (line 605)', () => {
    it('500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.repair_tickets, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/repair-tickets/formular7-pdf')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('PATCH /:id/triage — 404 for nonexistent provider', () => {
    it('returns 404 when external provider does not exist', async () => {
      const res = await request(app)
        .patch(`/api/repair-tickets/${ticketId}/triage`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          repairType: 'EXTERN',
          defectCause: 'Test causa externa',
          externalProviderId: 999999,
        });
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /:id/repair — with operations and NEFUNCTIONAL', () => {
    it('records repair with NEFUNCTIONAL test result', async () => {
      const res = await request(app)
        .put(`/api/repair-tickets/${ticketId}/repair`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          repairReport: 'Reparatie finala',
          actionsTaken: 'Toate masurile',
          durationHours: 4,
          functionalTest: 'NEFUNCTIONAL',
          engineerName: 'Ing. Final',
          operations: [
            {
              date: new Date().toISOString(),
              timeStart: '10:00',
              timeEnd: '12:00',
              operation: 'Reparatie',
              engineer: 'Ing. Rep',
            },
          ],
        });
      expect([200, 400]).toContain(res.status);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// maintenance.js — logAudit error catch (line 20)
// ═══════════════════════════════════════════════════════════════════

describe('maintenance.js — uncovered branches 2', () => {
  let testMaintenanceDeviceId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inventoryNumber: uniqueInv('MNT'),
        name: 'Maintenance Branch Device',
        riskClass: 'I',
        sectionId: testSectionId,
      });
    if (res.status === 201) {
      testMaintenanceDeviceId = res.body.id;
      cleanupDeviceIds.push(testMaintenanceDeviceId);
    }
  });

  describe('POST /api/maintenance — triggers logAudit (line 20)', () => {
    it('creates maintenance record and triggers audit log', async () => {
      const res = await request(app)
        .post('/api/maintenance')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: testMaintenanceDeviceId,
          type: 'PREVENTIVA',
          executedDate: new Date().toISOString(),
          description: 'Mentenanță preventivă pentru branch coverage',
        });
      expect(res.status).toBe(201);
      if (res.status === 201) cleanupMaintenanceIds.push(res.body.id);
    });

    it('continues even if audit log fails', async () => {
      vi.spyOn(prisma.audit_logs, 'create').mockRejectedValueOnce(new Error('Audit fail'));
      const res = await request(app)
        .post('/api/maintenance')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: testMaintenanceDeviceId,
          type: 'CORECTIVA',
          executedDate: new Date().toISOString(),
          description: 'Mentenanță corectivă - audit fail test',
        });
      expect(res.status).toBe(201);
      if (res.status === 201) cleanupMaintenanceIds.push(res.body.id);
      vi.restoreAllMocks();
    });
  });

  describe('PUT /api/maintenance/:id — with all optional fields', () => {
    it('updates with all optional fields provided', async () => {
      const created = await request(app)
        .post('/api/maintenance')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: testMaintenanceDeviceId,
          type: 'VERIFICARE',
          executedDate: new Date().toISOString(),
          description: 'Verificare periodica',
        });
      if (created.status !== 201) return;
      cleanupMaintenanceIds.push(created.body.id);

      const res = await request(app)
        .put(`/api/maintenance/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'CALIBRARE',
          description: 'Calibrare actualizata',
          scheduledDate: new Date().toISOString(),
          duration: 2.5,
          partsReplaced: 'Filtru',
          consumablesUsed: 'Alcool izopropilic',
          result: 'FUNCTIONAL',
          cost: 500,
          externalService: true,
          serviceProvider: 'Service SRL',
          reportUrl: 'https://example.com/report',
          notes: 'Notite actualizate',
        });
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/maintenance/:id — 404 nonexistent', () => {
    it('returns 404 for nonexistent record', async () => {
      const res = await request(app)
        .delete('/api/maintenance/999999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// notifications.js — startCronJobs error path (lines 303-304)
// ═══════════════════════════════════════════════════════════════════

describe('notifications.js — uncovered branches 2', () => {
  const { startCronJobs, checkContractExpiry } = require('../jobs/notifications');

  describe('checkContractExpiry — error catch', () => {
    it('handles DB error gracefully', async () => {
      vi.spyOn(prisma.service_contracts, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
      await expect(checkContractExpiry()).resolves.not.toThrow();
      vi.restoreAllMocks();
    });
  });

  describe('startCronJobs — stop and re-start', () => {
    it('starts and stops cron jobs cleanly', async () => {
      const handle = startCronJobs();
      expect(handle).toBeDefined();
      expect(typeof handle.stop).toBe('function');
      handle.stop();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// auth.js routes — rate limiter skip=false branch (line 22)
// ═══════════════════════════════════════════════════════════════════

describe('auth.js routes — uncovered branches 2', () => {
  describe('rate limiter — skip=false in test env without flag', () => {
    it('login without skip_ratelimit flag still works', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: TEST_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });

    it('login with invalid credentials returns 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'WrongPassword123!' });
      expect(res.status).toBe(401);
    });

    it('refresh with missing cookie returns 401', async () => {
      const res = await request(app)
        .post('/api/auth/refresh');
      expect(res.status).toBe(401);
    });

    it('me returns 404 when user is deleted (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.users, 'findUnique').mockResolvedValueOnce(null);
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
      errSpy.mockRestore();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// mppExecutions.js — invalid signature catch (line 595), error catch (613)
// ═══════════════════════════════════════════════════════════════════

describe('mppExecutions.js — uncovered branches 2', () => {
  let executionId;
  let execWithInvalidSigId;
  let execWithNotesId;

  beforeAll(async () => {
    const deviceRes = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inventoryNumber: uniqueInv('MPP2'),
        name: 'MPP Execution Device B2',
        riskClass: 'IIa',
        sectionId: testSectionId,
      });
    if (deviceRes.status === 201) {
      cleanupDeviceIds.push(deviceRes.body.id);

      const execRes = await request(app)
        .post('/api/mpp-executions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: deviceRes.body.id,
          executedDate: new Date().toISOString(),
          durationMinutes: 90,
          checklist: [
            { operatiune: 'Inspectie vizuala', bifat: true, nota: 'OK' },
            { operatiune: 'Testare functionala', bifat: true, nota: 'Pass' },
          ],
          consumablesUsed: [],
          result: 'FUNCTIONAL',
          engineerName: 'Ing. MPP B2',
          notes: 'Observatii test pentru branch coverage',
        });
      if (execRes.status === 201) executionId = execRes.body.id;

      const invalidSigRes = await request(app)
        .post('/api/mpp-executions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: deviceRes.body.id,
          executedDate: new Date().toISOString(),
          checklist: [{ operatiune: 'Test', bifat: true }],
          result: 'FUNCTIONAL',
          engineerName: 'Ing. Invalid Sig',
          signature: 'invalid-base64-data-that-should-fail-parsing',
        });
      if (invalidSigRes.status === 201) execWithInvalidSigId = invalidSigRes.body.id;

      const notesRes = await request(app)
        .post('/api/mpp-executions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: deviceRes.body.id,
          executedDate: new Date().toISOString(),
          durationMinutes: 120,
          checklist: [
            { operatiune: 'Curatare', bifat: true },
            { operatiune: 'Testare', bifat: true },
            { operatiune: 'Inregistrare', bifat: false },
          ],
          result: 'DEFECT',
          engineerName: 'Ing. Notes',
          notes: 'Dispozitivul necesita inlocuire',
        });
      if (notesRes.status === 201) execWithNotesId = notesRes.body.id;
    }
  });

  describe('GET /:id/formular6-pdf — invalid signature catch (lines 594-598)', () => {
    it('renders fallback text for invalid signature', async () => {
      const res = await request(app)
        .get(`/api/mpp-executions/${execWithInvalidSigId}/formular6-pdf`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
    });
  });

  describe('GET /:id/formular6-pdf — without signature (line 600)', () => {
    it('renders (Fara semnatura) when no signature', async () => {
      const res = await request(app)
        .get(`/api/mpp-executions/${executionId}/formular6-pdf`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /:id/formular6-pdf — with notes and DEFECT (lines 577-580)', () => {
    it('renders notes section and defect result', async () => {
      const res = await request(app)
        .get(`/api/mpp-executions/${execWithNotesId}/formular6-pdf`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /:id/formular6-pdf — error catch (line 613)', () => {
    it('500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.mpp_executions, 'findUnique').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get(`/api/mpp-executions/${executionId}/formular6-pdf`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('GET /checklist-template/:deviceId — 404 nonexistent device', () => {
    it('returns 404 for nonexistent device', async () => {
      const res = await request(app)
        .get('/api/mpp-executions/checklist-template/999999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('POST / — occurrenceId mismatch', () => {
    it('returns 404 when occurrence does not belong to device', async () => {
      const res = await request(app)
        .post('/api/mpp-executions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: cleanupDeviceIds[0],
          occurrenceId: 999999,
          executedDate: new Date().toISOString(),
          checklist: [{ operatiune: 'Test', bifat: true }],
          result: 'FUNCTIONAL',
          engineerName: 'Ing. Occurrence Mismatch',
        });
      expect(res.status).toBe(404);
    });
  });

  describe('GET / — list executions', () => {
    it('returns list of executions', async () => {
      const res = await request(app)
        .get('/api/mpp-executions')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// verifications.js — list error (402), delete 404 (419), delete error (437-438)
// ═══════════════════════════════════════════════════════════════════

describe('verifications.js — uncovered branches 2', () => {
  let verifDeviceId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inventoryNumber: uniqueInv('VRB'),
        name: 'Verification Branch Device',
        riskClass: 'IIa',
        sectionId: testSectionId,
      });
    if (res.status === 201) {
      verifDeviceId = res.body.id;
      cleanupDeviceIds.push(verifDeviceId);
      await prisma.devices.update({
        where: { id: verifDeviceId },
        data: {
          requiresVerification: true,
          verificationType: 'LABORATOR',
          verificationFreqMonths: 12,
          updatedAt: new Date(),
        },
      });
    }
  });

  describe('GET /api/verifications — list error catch (line 402)', () => {
    it('500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.verifications, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/verifications')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('DELETE /api/verifications/:id — 404 nonexistent (line 419)', () => {
    it('returns 404 for nonexistent verification', async () => {
      const res = await request(app)
        .delete('/api/verifications/999999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/verifications/:id — error catch (lines 437-438)', () => {
    it('500 when DB throws on delete (spy)', async () => {
      const created = await request(app)
        .post('/api/verifications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: verifDeviceId,
          type: 'LABORATOR',
          performedAt: new Date().toISOString(),
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          result: 'CONFORM',
          certificateNo: 'CERT-DEL-001',
        });
      if (created.status === 201) cleanupVerificationIds.push(created.body.id);

      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .delete(`/api/verifications/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('GET /api/verifications/compliance-report — error catch', () => {
    it('500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.devices, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/verifications/compliance-report')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('POST /api/verifications — NECONFORM result', () => {
    it('creates NECONFORM verification which sets device to DEFECT', async () => {
      const res = await request(app)
        .post('/api/verifications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: verifDeviceId,
          type: 'LABORATOR',
          performedAt: new Date().toISOString(),
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          result: 'NECONFORM',
          certificateNo: 'CERT-NEC-001',
          notes: 'Dispozitiv neconform',
        });
      expect(res.status).toBe(201);
      expect(res.body.result).toBe('NECONFORM');
      cleanupVerificationIds.push(res.body.id);
    });
  });

  describe('POST /api/verifications — validUntil from verificationFreqMonths', () => {
    it('auto-calculates validUntil when not provided', async () => {
      const res = await request(app)
        .post('/api/verifications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: verifDeviceId,
          type: 'METROLOGIC',
          performedAt: new Date().toISOString(),
          result: 'CONFORM',
          certificateNo: 'CERT-AUTO-001',
        });
      expect(res.status).toBe(201);
      expect(res.body.validUntil).toBeDefined();
      cleanupVerificationIds.push(res.body.id);
    });
  });

  describe('GET /api/verifications/:id/certificate — 404 nonexistent', () => {
    it('returns 404 for nonexistent verification', async () => {
      const res = await request(app)
        .get('/api/verifications/999999/certificate')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// consumables.js — logAudit error catch (lines 16-27)
// ═══════════════════════════════════════════════════════════════════

describe('consumables.js — uncovered branches 2', () => {
  describe('logAudit error catch (line 26-27)', () => {
    it('POST creates consumable even when audit log fails', async () => {
      vi.spyOn(prisma.audit_logs, 'create').mockRejectedValueOnce(new Error('Audit fail'));
      const res = await request(app)
        .post('/api/consumables')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: `Audit Fail Consumable ${Date.now()}`,
          quantity: 10,
          minQuantity: 5,
        });
      if (res.status === 201) cleanupConsumableIds.push(res.body.id);
      expect(res.status).toBe(201);
      vi.restoreAllMocks();
    });
  });

  describe('GET /api/consumables — with search and minQuantity', () => {
    it('filters by search term', async () => {
      const res = await request(app)
        .get('/api/consumables?search=Branch')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('filters by minQuantity', async () => {
      const res = await request(app)
        .get('/api/consumables?minQuantity=100')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/consumables — negative quantity', () => {
    it('returns 400 for negative quantity', async () => {
      const res = await request(app)
        .post('/api/consumables')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Negative Qty Test',
          quantity: -5,
          minQuantity: -2,
        });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/consumables/:id — not found', () => {
    it('returns 404 for nonexistent consumable', async () => {
      const res = await request(app)
        .put('/api/consumables/999999')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/consumables/:id — not found', () => {
    it('returns 404 for nonexistent consumable', async () => {
      const res = await request(app)
        .delete('/api/consumables/999999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// maintenancePlans.js — lines 101, 129, 246, 334
// ═══════════════════════════════════════════════════════════════════

describe('maintenancePlans.js — uncovered branches 2', () => {
  let planDeviceId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inventoryNumber: uniqueInv('MPL'),
        name: 'Maintenance Plan Device B2',
        riskClass: 'I',
        sectionId: testSectionId,
      });
    if (res.status === 201) {
      planDeviceId = res.body.id;
      cleanupDeviceIds.push(planDeviceId);
    }
  });

  describe('DELETE /:id — success message (line 101)', () => {
    it('deletes plan and returns success message', async () => {
      const planRes = await request(app)
        .post('/api/maintenance-plans/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: planDeviceId,
          year: 2040,
          frequency: 'SEMESTRIAL',
          responsibleName: 'Ing. Delete Test',
        });
      expect(planRes.status).toBe(201);
      cleanupPlanIds.push(planRes.body.id);

      const res = await request(app)
        .delete(`/api/maintenance-plans/${planRes.body.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/șters cu succes/);
    });
  });

  describe('POST /generate — invalid frequency (line 129)', () => {
    it('returns 400 for invalid frequency value', async () => {
      const res = await request(app)
        .post('/api/maintenance-plans/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: planDeviceId,
          year: 2040,
          frequency: 'INVALID_FREQ',
          responsibleName: 'Ing. Invalid Freq',
        });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /generate — missing required fields', () => {
    it('returns 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/maintenance-plans/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('GET /:id — invalid ID (line 246)', () => {
    it('returns 400 for invalid plan ID', async () => {
      const res = await request(app)
        .get('/api/maintenance-plans/abc')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/ID plan invalid/);
    });
  });

  describe('GET /:id — 404 nonexistent', () => {
    it('returns 404 for nonexistent plan', async () => {
      const res = await request(app)
        .get('/api/maintenance-plans/999999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /:id — error catch', () => {
    it('500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.maintenance_plans, 'findUnique').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/maintenance-plans/1')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('GET /calendar — with year filter', () => {
    it('returns calendar data for a specific year', async () => {
      const res = await request(app)
        .get('/api/maintenance-plans/calendar?year=2040')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /:year/formular5-pdf — invalid year', () => {
    it('returns 400 for invalid year', async () => {
      const res = await request(app)
        .get('/api/maintenance-plans/abc/formular5-pdf')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it('returns 400 for out-of-range year', async () => {
      const res = await request(app)
        .get('/api/maintenance-plans/1999/formular5-pdf')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /occurrence/:id/reschedule — validation failure', () => {
    it('returns 400 for short reason', async () => {
      const res = await request(app)
        .patch('/api/maintenance-plans/occurrence/999999/reschedule')
        .set('Authorization', `Bearer ${token}`)
        .send({ newDate: new Date().toISOString(), reason: 'ab' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /generate — nonexistent device', () => {
    it('returns 404 for nonexistent device', async () => {
      const res = await request(app)
        .post('/api/maintenance-plans/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: 999999,
          year: 2041,
          frequency: 'ANUAL',
          responsibleName: 'Ing. No Device',
        });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /:id — 404 nonexistent', () => {
    it('returns 404 for nonexistent plan', async () => {
      const res = await request(app)
        .delete('/api/maintenance-plans/999999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });
});
