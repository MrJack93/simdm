/**
 * Tests targeting specific uncovered lines and branches to improve coverage
 * from 86% to 90%+ across all metrics.
 *
 * Covers:
 *   incidents.js      — POST with all field branches, PUT with all field combos, error catches
 *   serviceContracts.js — cost-analysis, provider listing/details, delete provider, pagination
 *   maintenancePlans.js — reschedule error, formular5-pdf error, toSafePdfText
 *   consumables.js    — logAudit error, POST /:id/stock endpoint
 *   devices.js        — fisa-pdf endpoint, file serving endpoint
 *   auditLogs.js      — export CSV with date filters, error catches
 *   notifications.js  — cron error path, more device states
 *   mppExecutions.js  — formular6-pdf signature rendering
 */
const request = require('supertest');
const app = require('../index');
const prisma = require('../db');

const {
  checkVerificationExpiry,
  checkMppDue,
  checkRepairTickets,
  generateComplianceSummary,
  startCronJobs,
} = require('../jobs/notifications');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

let token;
let userId;
let testDeviceId;
let testSectionId;
let testProviderId;
let testContractId;
let testConsumableId;
let testMppPlanId;

const cleanupIncidentIds = [];
const cleanupContractIds = [];
const cleanupProviderIds = [];
const cleanupConsumableIds = [];
const cleanupDeviceIds = [];
const cleanupMppPlanIds = [];

function uniqueInv(prefix = 'BCOV') {
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

  const deviceRes = await request(app)
    .post('/api/devices')
    .set('Authorization', `Bearer ${token}`)
    .send({
      inventoryNumber: uniqueInv(),
      name: 'Coverage Branches Device',
      riskClass: 'IIa',
      sectionId: testSectionId,
    });
  testDeviceId = deviceRes.body.id;
  cleanupDeviceIds.push(testDeviceId);

  const providerRes = await request(app)
    .post('/api/service-contracts/providers')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: `Branch Provider ${Date.now()}`,
      contact: 'Test Contact',
      email: `branch${Date.now()}@test.md`,
    });
  testProviderId = providerRes.body.id;
  cleanupProviderIds.push(testProviderId);

  const contractRes = await request(app)
    .post('/api/service-contracts/contracts')
    .set('Authorization', `Bearer ${token}`)
    .send({
      providerId: testProviderId,
      contractNo: `BRANCH-CONTRACT-${Date.now()}`,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      value: 10000,
    });
  testContractId = contractRes.body.id;
  cleanupContractIds.push(testContractId);

  const consumRes = await request(app)
    .post('/api/consumables')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: `Branch Consumable ${Date.now()}`,
      quantity: 50,
      minQuantity: 10,
    });
  testConsumableId = consumRes.body.id;
  cleanupConsumableIds.push(testConsumableId);
});

afterAll(async () => {
  if (cleanupIncidentIds.length) {
    await prisma.incidents.deleteMany({ where: { id: { in: cleanupIncidentIds } } });
  }
  if (cleanupContractIds.length) {
    await prisma.service_contracts.deleteMany({ where: { id: { in: cleanupContractIds } } });
  }
  if (cleanupProviderIds.length) {
    await prisma.provider_ratings.deleteMany({ where: { providerId: { in: cleanupProviderIds } } });
    await prisma.service_providers.deleteMany({ where: { id: { in: cleanupProviderIds } } });
  }
  if (cleanupConsumableIds.length) {
    await prisma.consumables.deleteMany({ where: { id: { in: cleanupConsumableIds } } });
  }
  if (cleanupMppPlanIds.length) {
    for (const planId of cleanupMppPlanIds) {
      await prisma.mpp_occurrences.deleteMany({ where: { planId } });
    }
    await prisma.maintenance_plans.deleteMany({ where: { id: { in: cleanupMppPlanIds } } });
  }
  if (cleanupDeviceIds.length) {
    await prisma.incidents.deleteMany({ where: { deviceId: { in: cleanupDeviceIds } } });
    await prisma.maintenance_records.deleteMany({ where: { deviceId: { in: cleanupDeviceIds } } });
    await prisma.mpp_executions.deleteMany({ where: { deviceId: { in: cleanupDeviceIds } } });
    await prisma.devices.deleteMany({ where: { id: { in: cleanupDeviceIds } } });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ═══════════════════════════════════════════════════════════════════
// incidents.js — branch coverage (58.77% → target 80%+)
// Uncovered: lines 111-212, 235-236
// ═══════════════════════════════════════════════════════════════════

describe('incidents.js — uncovered branches', () => {
  async function createIncident(body = {}) {
    const res = await request(app)
      .post('/api/incidents')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        occurredAt: new Date().toISOString(),
        description: `Branch test ${Date.now()}`,
        severity: 'MINOR',
        ...body,
      });
    if (res.status === 201) cleanupIncidentIds.push(res.body.id);
    return res;
  }

  describe('POST /api/incidents — missing description branch (line 111)', () => {
    it('returns 400 when description is empty string', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: testDeviceId,
          occurredAt: new Date().toISOString(),
          description: '',
          severity: 'MINOR',
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Descrierea/i);
    });

    it('returns 400 when description is whitespace only', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: testDeviceId,
          occurredAt: new Date().toISOString(),
          description: '   ',
          severity: 'MINOR',
        });
      expect(res.status).toBe(400);
    });

    it('returns 400 when occurredAt is missing', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: testDeviceId,
          description: 'Missing occurredAt',
          severity: 'MINOR',
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Data incidentului/i);
    });

    it('returns 404 when device does not exist', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: 999999,
          occurredAt: new Date().toISOString(),
          description: 'Non-existent device',
          severity: 'MINOR',
        });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/incidents — patientAffected / reportedToAmdm branches (lines 126-133)', () => {
    it('creates with patientAffected=true and patientHarm provided', async () => {
      const res = await createIncident({
        patientAffected: true,
        patientHarm: 'Pacientul a suferit o ușoară contuzie',
        rootCause: 'Eroare operator',
        correctiveAction: 'Reantrenare',
        preventiveAction: 'Manual actualizat',
      });
      expect(res.status).toBe(201);
      expect(res.body.patientAffected).toBe(true);
      expect(res.body.patientHarm).toBe('Pacientul a suferit o ușoară contuzie');
      expect(res.body.rootCause).toBe('Eroare operator');
      expect(res.body.correctiveAction).toBe('Reantrenare');
      expect(res.body.preventiveAction).toBe('Manual actualizat');
    });

    it('creates with patientAffected=true and patientHarm empty string', async () => {
      const res = await createIncident({
        patientAffected: true,
        patientHarm: '',
      });
      expect(res.status).toBe(201);
      expect(res.body.patientAffected).toBe(true);
      expect(res.body.patientHarm).toBeNull();
    });

    it('creates with patientAffected=false, patientHarm is null', async () => {
      const res = await createIncident({
        patientAffected: false,
        patientHarm: 'should be ignored',
      });
      expect(res.status).toBe(201);
      expect(res.body.patientAffected).toBe(false);
      expect(res.body.patientHarm).toBeNull();
    });

    it('creates with reportedToAmdm=true and report fields', async () => {
      const res = await createIncident({
        reportedToAmdm: true,
        amdmReportDate: new Date().toISOString(),
        amdmReportRef: 'REF-AMDM-001',
      });
      expect(res.status).toBe(201);
      expect(res.body.reportedToAmdm).toBe(true);
      expect(res.body.amdmReportRef).toBe('REF-AMDM-001');
    });

    it('creates with reportedToAmdm=true and empty amdmReportRef', async () => {
      const res = await createIncident({
        reportedToAmdm: true,
        amdmReportRef: '',
      });
      expect(res.status).toBe(201);
      expect(res.body.reportedToAmdm).toBe(true);
      expect(res.body.amdmReportRef).toBeNull();
    });

    it('creates with reportedToAmdm=false, amdm fields are null', async () => {
      const res = await createIncident({
        reportedToAmdm: false,
        amdmReportDate: new Date().toISOString(),
        amdmReportRef: 'should be ignored',
      });
      expect(res.status).toBe(201);
      expect(res.body.reportedToAmdm).toBe(false);
      expect(res.body.amdmReportDate).toBeNull();
      expect(res.body.amdmReportRef).toBeNull();
    });

    it('creates with sectionId provided', async () => {
      const res = await createIncident({
        sectionId: testSectionId,
      });
      expect(res.status).toBe(201);
    });

    it('creates with null optional string fields', async () => {
      const res = await createIncident({
        rootCause: null,
        correctiveAction: null,
        preventiveAction: null,
      });
      expect(res.status).toBe(201);
    });

    it('500 when DB throws on create (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: testDeviceId,
          occurredAt: new Date().toISOString(),
          description: 'DB error test',
          severity: 'MINOR',
        });
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('PUT /api/incidents/:id — all field branches (lines 159-213)', () => {
    let incidentId;

    beforeAll(async () => {
      const res = await createIncident();
      incidentId = res.body.id;
    });

    it('updates occurredAt', async () => {
      const newDate = new Date(Date.now() + 86400000).toISOString();
      const res = await request(app)
        .put(`/api/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ occurredAt: newDate });
      expect(res.status).toBe(200);
    });

    it('updates description', async () => {
      const res = await request(app)
        .put(`/api/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Updated description' });
      expect(res.status).toBe(200);
      expect(res.body.description).toBe('Updated description');
    });

    it('updates patientAffected and patientHarm', async () => {
      const res = await request(app)
        .put(`/api/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ patientAffected: true, patientHarm: 'Harm updated' });
      expect(res.status).toBe(200);
      expect(res.body.patientAffected).toBe(true);
      expect(res.body.patientHarm).toBe('Harm updated');
    });

    it('sets patientHarm explicitly when patientAffected=false', async () => {
      const res = await request(app)
        .put(`/api/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ patientAffected: false, patientHarm: 'test harm' });
      expect(res.status).toBe(200);
      expect(res.body.patientAffected).toBe(false);
    });

    it('updates rootCause, correctiveAction, preventiveAction', async () => {
      const res = await request(app)
        .put(`/api/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rootCause: 'Root cause updated',
          correctiveAction: 'Corrective updated',
          preventiveAction: 'Preventive updated',
        });
      expect(res.status).toBe(200);
      expect(res.body.rootCause).toBe('Root cause updated');
      expect(res.body.correctiveAction).toBe('Corrective updated');
      expect(res.body.preventiveAction).toBe('Preventive updated');
    });

    it('sets string fields to null when empty', async () => {
      const res = await request(app)
        .put(`/api/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rootCause: '', correctiveAction: '', preventiveAction: '' });
      expect(res.status).toBe(200);
      expect(res.body.rootCause).toBeNull();
    });

    it('updates resolvedAt', async () => {
      const res = await request(app)
        .put(`/api/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ resolvedAt: new Date().toISOString() });
      expect(res.status).toBe(200);
      expect(res.body.resolvedAt).not.toBeNull();
    });

    it('sets resolvedAt to null', async () => {
      const res = await request(app)
        .put(`/api/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ resolvedAt: null });
      expect(res.status).toBe(200);
      expect(res.body.resolvedAt).toBeNull();
    });

    it('updates reportedToAmdm=true with report fields', async () => {
      const res = await request(app)
        .put(`/api/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          reportedToAmdm: true,
          amdmReportDate: new Date().toISOString(),
          amdmReportRef: 'REF-UPDATE-001',
        });
      expect(res.status).toBe(200);
      expect(res.body.reportedToAmdm).toBe(true);
      expect(res.body.amdmReportRef).toBe('REF-UPDATE-001');
    });

    it('sets reportedToAmdm=false', async () => {
      const res = await request(app)
        .put(`/api/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reportedToAmdm: false });
      expect(res.status).toBe(200);
      expect(res.body.reportedToAmdm).toBe(false);
    });

    it('updates amdmReportDate to null', async () => {
      const res = await request(app)
        .put(`/api/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amdmReportDate: null });
      expect(res.status).toBe(200);
    });

    it('updates amdmReportRef to empty string (null)', async () => {
      const res = await request(app)
        .put(`/api/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amdmReportRef: '' });
      expect(res.status).toBe(200);
    });

    it('returns 400 for invalid status', async () => {
      const res = await request(app)
        .put(`/api/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'INVALID_STATUS' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Statusul/i);
    });

    it('returns 404 for nonexistent incident', async () => {
      const res = await request(app)
        .put('/api/incidents/999999')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Test' });
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid id', async () => {
      const res = await request(app)
        .put('/api/incidents/abc')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Test' });
      expect(res.status).toBe(400);
    });

    it('500 when DB throws on update (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .put(`/api/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'DB fail test' });
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('DELETE /api/incidents/:id — error catch (lines 235-236)', () => {
    it('returns 400 for invalid id', async () => {
      const res = await request(app)
        .delete('/api/incidents/abc')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it('500 when DB throws on delete (spy)', async () => {
      const created = await createIncident();
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .delete(`/api/incidents/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('GET /api/incidents — pagination edge cases', () => {
    it('normalizes page=0 to page=1', async () => {
      const res = await request(app)
        .get('/api/incidents?page=0')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
    });

    it('caps limit to 100', async () => {
      const res = await request(app)
        .get('/api/incidents?limit=500')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.pagination.limit).toBe(100);
    });

    it('ignores invalid severity', async () => {
      const res = await request(app)
        .get('/api/incidents?severity=INVALID')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('ignores invalid status', async () => {
      const res = await request(app)
        .get('/api/incidents?status=INVALID')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('500 when DB throws on list (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.incidents, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/incidents')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('GET /api/incidents/:id — error catch (line 94-97)', () => {
    it('500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.incidents, 'findUnique').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/incidents/1')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// serviceContracts.js — lines 269-470, 476-511
// ═══════════════════════════════════════════════════════════════════

describe('serviceContracts.js — uncovered branches', () => {
  describe('GET /api/service-contracts/cost-analysis (lines 301-381)', () => {
    it('returns full cost analysis with byProvider breakdown', async () => {
      const res = await request(app)
        .get('/api/service-contracts/cost-analysis')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('internal');
      expect(res.body).toHaveProperty('external');
      expect(res.body).toHaveProperty('comparison');
      expect(res.body).toHaveProperty('byProvider');
      expect(res.body).toHaveProperty('contractStatus');
      expect(Array.isArray(res.body.byProvider)).toBe(true);
      expect(typeof res.body.comparison.internalAvgPerRepair).toBe('string');
      expect(typeof res.body.comparison.externalAvgPerContract).toBe('string');
      expect(typeof res.body.comparison.savings).toBe('string');
    });

    it('500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.repair_tickets, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/service-contracts/cost-analysis')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('GET /api/service-contracts/providers (lines 384-400)', () => {
    it('returns providers with _count for contracts and ratings', async () => {
      const res = await request(app)
        .get('/api/service-contracts/providers')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((p) => {
        expect(p._count).toHaveProperty('contracts');
        expect(p._count).toHaveProperty('ratings');
      });
    });

    it('500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.service_providers, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/service-contracts/providers')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('GET /api/service-contracts/providers/:id (lines 403-431)', () => {
    it('returns provider details with contracts and ratings', async () => {
      const res = await request(app)
        .get(`/api/service-contracts/providers/${testProviderId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(testProviderId);
      expect(Array.isArray(res.body.contracts)).toBe(true);
      expect(Array.isArray(res.body.ratings)).toBe(true);
    });

    it('returns 400 for invalid id', async () => {
      const res = await request(app)
        .get('/api/service-contracts/providers/abc')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it('500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.service_providers, 'findUnique').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/service-contracts/providers/1')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('DELETE /api/service-contracts/contracts/:id (lines 434-472)', () => {
    it('returns 400 for invalid id', async () => {
      const res = await request(app)
        .delete('/api/service-contracts/contracts/abc')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it('500 when DB throws on delete (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .delete(`/api/service-contracts/contracts/${testContractId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('DELETE /api/service-contracts/providers/:id (lines 475-513)', () => {
    let deleteProviderId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/service-contracts/providers')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Delete Provider ${Date.now()}` });
      deleteProviderId = res.body.id;
    });

    it('deletes provider and creates audit log', async () => {
      const res = await request(app)
        .delete(`/api/service-contracts/providers/${deleteProviderId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/șters cu succes/i);
      deleteProviderId = null;
    });

    it('returns 400 for invalid id', async () => {
      const res = await request(app)
        .delete('/api/service-contracts/providers/abc')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it('returns 404 for nonexistent provider', async () => {
      const res = await request(app)
        .delete('/api/service-contracts/providers/999999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it('500 when DB throws on provider delete (spy)', async () => {
      const provRes = await request(app)
        .post('/api/service-contracts/providers')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Error Provider ${Date.now()}` });
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .delete(`/api/service-contracts/providers/${provRes.body.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('GET /api/service-contracts/contracts — pagination edge cases', () => {
    it('returns 400 for invalid page', async () => {
      const res = await request(app)
        .get('/api/service-contracts/contracts?page=abc')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid limit', async () => {
      const res = await request(app)
        .get('/api/service-contracts/contracts?limit=abc')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it('500 when DB throws on list (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.service_contracts, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/service-contracts/contracts')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('POST /api/service-contracts/providers — error catches', () => {
    it('500 when DB throws on provider create (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .post('/api/service-contracts/providers')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Error Provider' });
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('POST /api/service-contracts/contracts — error catches', () => {
    it('500 when DB throws on contract create (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .post('/api/service-contracts/contracts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          providerId: testProviderId,
          contractNo: `ERR-${Date.now()}`,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
        });
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('POST /api/service-contracts/providers/:id/rate — error catch', () => {
    it('500 when DB throws on rate (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .post(`/api/service-contracts/providers/${testProviderId}/rate`)
        .set('Authorization', `Bearer ${token}`)
        .send({ score: 4 });
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// maintenancePlans.js — lines 327-334, 453-456
// ═══════════════════════════════════════════════════════════════════

describe('maintenancePlans.js — uncovered branches', () => {
  let planId;
  let occurrenceId;

  beforeAll(async () => {
    const planRes = await request(app)
      .post('/api/maintenance-plans/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        year: 2035,
        frequency: 'BIMESTRIAL',
        responsibleName: 'Ing. Branch Coverage',
        responsibleAffil: 'Bioinginerie',
      });
    planId = planRes.body.id;
    cleanupMppPlanIds.push(planId);

    const detailsRes = await request(app)
      .get(`/api/maintenance-plans/${planId}`)
      .set('Authorization', `Bearer ${token}`);
    occurrenceId = detailsRes.body.occurrences[0].id;
  });

  describe('PATCH /occurrence/:id/reschedule — error catch (lines 327-328)', () => {
    it('returns 400 for invalid occurrence id', async () => {
      const res = await request(app)
        .patch('/api/maintenance-plans/occurrence/abc/reschedule')
        .set('Authorization', `Bearer ${token}`)
        .send({ newDate: new Date().toISOString(), reason: 'Test reason here' });
      expect(res.status).toBe(400);
    });

    it('returns 404 for nonexistent occurrence', async () => {
      const res = await request(app)
        .patch('/api/maintenance-plans/occurrence/999999/reschedule')
        .set('Authorization', `Bearer ${token}`)
        .send({ newDate: new Date().toISOString(), reason: 'Test reason here' });
      expect(res.status).toBe(404);
    });

    it('500 when DB throws on reschedule (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .patch(`/api/maintenance-plans/occurrence/${occurrenceId}/reschedule`)
        .set('Authorization', `Bearer ${token}`)
        .send({ newDate: new Date().toISOString(), reason: 'DB fail reason test' });
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('GET /:year/formular5-pdf — error catch (lines 453-456)', () => {
    it('500 when DB throws on PDF generation (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.maintenance_plans, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/maintenance-plans/2035/formular5-pdf')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/PDF/i);
      errSpy.mockRestore();
    });
  });

  describe('DELETE /api/maintenance-plans/:id — error catch', () => {
    it('returns 400 for invalid id', async () => {
      const res = await request(app)
        .delete('/api/maintenance-plans/abc')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it('500 when DB throws on delete (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .delete(`/api/maintenance-plans/${planId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('POST /api/maintenance-plans/generate — error catches', () => {
    it('returns 404 for nonexistent device', async () => {
      const res = await request(app)
        .post('/api/maintenance-plans/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: 999999,
          year: 2036,
          frequency: 'LUNAR',
          responsibleName: 'Ing. Test',
        });
      expect(res.status).toBe(404);
    });

    it('500 when DB throws on generate (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .post('/api/maintenance-plans/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: testDeviceId,
          year: 2037,
          frequency: 'LUNAR',
          responsibleName: 'Ing. Test',
        });
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('GET /api/maintenance-plans/calendar — error catch', () => {
    it('500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.mpp_occurrences, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/maintenance-plans/calendar')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('GET /api/maintenance-plans/:id — error catch', () => {
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
});

// ═══════════════════════════════════════════════════════════════════
// consumables.js — lines 16-27, 245-283
// ═══════════════════════════════════════════════════════════════════

describe('consumables.js — uncovered branches', () => {
  describe('POST /api/consumables/:id/stock — stock endpoint (lines 245-283)', () => {
    it('adds stock to consumable', async () => {
      const res = await request(app)
        .post(`/api/consumables/${testConsumableId}/stock`)
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 20 });
      expect(res.status).toBe(200);
      expect(res.body.quantity).toBe(70);
    });

    it('returns 400 for invalid id', async () => {
      const res = await request(app)
        .post('/api/consumables/abc/stock')
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 10 });
      expect(res.status).toBe(400);
    });

    it('returns 400 for non-positive quantity', async () => {
      const res = await request(app)
        .post(`/api/consumables/${testConsumableId}/stock`)
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 0 });
      expect(res.status).toBe(400);
    });

    it('returns 400 for negative quantity', async () => {
      const res = await request(app)
        .post(`/api/consumables/${testConsumableId}/stock`)
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: -5 });
      expect(res.status).toBe(400);
    });

    it('returns 400 for NaN quantity', async () => {
      const res = await request(app)
        .post(`/api/consumables/${testConsumableId}/stock`)
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 'abc' });
      expect(res.status).toBe(400);
    });

    it('returns 404 for nonexistent consumable', async () => {
      const res = await request(app)
        .post('/api/consumables/999999/stock')
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 10 });
      expect(res.status).toBe(404);
    });

    it('500 when DB throws on stock (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .post(`/api/consumables/${testConsumableId}/stock`)
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 10 });
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('consumables.js — error catches', () => {
    it('POST 500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .post('/api/consumables')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Error Test', quantity: 10 });
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });

    it('PUT 500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .put(`/api/consumables/${testConsumableId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 99 });
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });

    it('DELETE 500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .delete(`/api/consumables/${testConsumableId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });

    it('GET 500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.consumables, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/consumables')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });

    it('GET /dropdown 500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.consumables, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/consumables/dropdown')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('consumables.js — pagination edge cases', () => {
    it('normalizes page=0 to 1', async () => {
      const res = await request(app)
        .get('/api/consumables?page=0')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
    });

    it('caps limit to 100', async () => {
      const res = await request(app)
        .get('/api/consumables?limit=500')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.pagination.limit).toBe(100);
    });
  });

  describe('consumables.js — PUT validation edge cases', () => {
    it('returns 400 for invalid id', async () => {
      const res = await request(app)
        .put('/api/consumables/abc')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when name is empty string on update', async () => {
      const res = await request(app)
        .put(`/api/consumables/${testConsumableId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '' });
      expect(res.status).toBe(400);
    });
  });

  describe('consumables.js — DELETE edge cases', () => {
    it('returns 400 for invalid id', async () => {
      const res = await request(app)
        .delete('/api/consumables/abc')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// devices.js — lines 617-723, 761-765
// ═══════════════════════════════════════════════════════════════════

describe('devices.js — uncovered branches', () => {
  describe('GET /api/devices/:id/fisa-pdf (lines 630-719)', () => {
    it('generates PDF for device with all optional fields', async () => {
      const fullDeviceRes = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${token}`)
        .send({
          inventoryNumber: uniqueInv('PDF'),
          name: 'Full Device for PDF',
          riskClass: 'III',
          sectionId: testSectionId,
          serialNumber: 'SN-12345',
          model: 'Model X',
          manufacturer: 'Mfg Y',
          countryOfOrigin: 'Moldova',
          yearMade: 2024,
          ceMarking: 'CE-0123',
          cndCode: 'CND-001',
          room: 'Camera 101',
          voltage: '220V',
          frequency: '50Hz',
          power: '500W',
          accessories: 'Cablu, adaptor',
          electricalSafetyClass: 'Clasa I',
          notes: 'Test notes for PDF',
        });
      if (fullDeviceRes.status === 201) cleanupDeviceIds.push(fullDeviceRes.body.id);

      const res = await request(app)
        .get(`/api/devices/${fullDeviceRes.body.id}/fisa-pdf?skip_ratelimit=true`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/pdf/);
    });

    it('generates PDF for device without notes (skips section 6)', async () => {
      const noNotesRes = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${token}`)
        .send({
          inventoryNumber: uniqueInv('NN'),
          name: 'No Notes Device',
          riskClass: 'I',
          sectionId: testSectionId,
        });
      if (noNotesRes.status === 201) cleanupDeviceIds.push(noNotesRes.body.id);

      const res = await request(app)
        .get(`/api/devices/${noNotesRes.body.id}/fisa-pdf?skip_ratelimit=true`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/pdf/);
    });
  });

  describe('GET /api/devices/file/:filename (lines 723-763)', () => {
    it('returns 404 for nonexistent file', async () => {
      const res = await request(app)
        .get('/api/devices/file/nonexistent-file-12345.pdf')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/devices/export/xlsx — with filters', () => {
    it('exports with search filter', async () => {
      const res = await request(app)
        .get('/api/devices/export/xlsx?search=Monitor&skip_ratelimit=true')
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/spreadsheetml\.sheet/);
    });

    it('exports with status filter', async () => {
      const res = await request(app)
        .get('/api/devices/export/xlsx?status=FUNCTIONAL&skip_ratelimit=true')
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect(res.status).toBe(200);
    });

    it('exports with riskClass filter', async () => {
      const res = await request(app)
        .get('/api/devices/export/xlsx?riskClass=I&skip_ratelimit=true')
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect(res.status).toBe(200);
    });

    it('exports with sectionId filter', async () => {
      const res = await request(app)
        .get(`/api/devices/export/xlsx?sectionId=${testSectionId}&skip_ratelimit=true`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/devices/export/csv — with filters', () => {
    it('exports with search filter', async () => {
      const res = await request(app)
        .get('/api/devices/export/csv?search=Monitor&skip_ratelimit=true')
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
    });

    it('exports with status filter', async () => {
      const res = await request(app)
        .get('/api/devices/export/csv?status=FUNCTIONAL&skip_ratelimit=true')
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect(res.status).toBe(200);
    });

    it('exports with riskClass filter', async () => {
      const res = await request(app)
        .get('/api/devices/export/csv?riskClass=IIa&skip_ratelimit=true')
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect(res.status).toBe(200);
    });

    it('exports with sectionId filter', async () => {
      const res = await request(app)
        .get(`/api/devices/export/csv?sectionId=${testSectionId}&skip_ratelimit=true`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect(res.status).toBe(200);
    });
  });

  describe('devices.js — error catches', () => {
    it('POST 500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${token}`)
        .send({
          inventoryNumber: uniqueInv('ERR'),
          name: 'Error Device',
          riskClass: 'I',
          sectionId: testSectionId,
        });
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });

    it('GET / 500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.devices, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/devices')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });

    it('GET /:id 500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.devices, 'findUnique').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/devices/1')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });

    it('PUT 500 when DB throws (spy)', async () => {
      const created = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${token}`)
        .send({
          inventoryNumber: uniqueInv('UPD'),
          name: 'Update Error Device',
          riskClass: 'I',
          sectionId: testSectionId,
        });
      if (created.status === 201) cleanupDeviceIds.push(created.body.id);
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .put(`/api/devices/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated' });
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });

    it('DELETE 500 when DB throws (spy)', async () => {
      const created = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${token}`)
        .send({
          inventoryNumber: uniqueInv('DEL'),
          name: 'Delete Error Device',
          riskClass: 'I',
          sectionId: testSectionId,
        });
      if (created.status === 201) cleanupDeviceIds.push(created.body.id);
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .delete(`/api/devices/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });

    it('export/xlsx 500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.devices, 'count').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/devices/export/xlsx?skip_ratelimit=true')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });

    it('export/csv 500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.devices, 'count').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/devices/export/csv?skip_ratelimit=true')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });

    it('PATCH 500 when DB throws (spy)', async () => {
      const created = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${token}`)
        .send({
          inventoryNumber: uniqueInv('PAT'),
          name: 'Patch Error Device',
          riskClass: 'I',
          sectionId: testSectionId,
        });
      if (created.status === 201) cleanupDeviceIds.push(created.body.id);
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .patch(`/api/devices/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Patched' });
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });

    it('fisa-pdf 500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.devices, 'findUnique').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/devices/1/fisa-pdf?skip_ratelimit=true')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('GET /api/devices — includeCasat=true', () => {
    it('includes CASAT devices when includeCasat=true', async () => {
      const res = await request(app)
        .get('/api/devices?includeCasat=true')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/devices/:id/upload — invalid id', () => {
    it('returns 400 for invalid id on upload', async () => {
      const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
      const res = await request(app)
        .post('/api/devices/abc/upload')
        .set('Authorization', `Bearer ${token}`)
        .field('field', 'manualUrl')
        .attach('file', pdf, 'manual.pdf');
      expect(res.status).toBe(400);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// auditLogs.js — lines 66-71, 107-108
// ═══════════════════════════════════════════════════════════════════

describe('auditLogs.js — uncovered branches', () => {
  describe('GET /api/audit-logs/export/csv — date filters (lines 66-71)', () => {
    it('exports CSV with dateFrom filter only', async () => {
      const dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app)
        .get(`/api/audit-logs/export/csv?dateFrom=${dateFrom}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
    });

    it('exports CSV with dateTo filter only', async () => {
      const dateTo = new Date().toISOString();
      const res = await request(app)
        .get(`/api/audit-logs/export/csv?dateTo=${dateTo}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
    });

    it('exports CSV with both dateFrom and dateTo', async () => {
      const dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const dateTo = new Date().toISOString();
      const res = await request(app)
        .get(`/api/audit-logs/export/csv?dateFrom=${dateFrom}&dateTo=${dateTo}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
    });

    it('exports CSV with action filter', async () => {
      const res = await request(app)
        .get('/api/audit-logs/export/csv?action=CREATE')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
    });

    it('500 when DB throws on export (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.audit_logs, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/audit-logs/export/csv')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('GET /api/audit-logs — error catch (line 51-54)', () => {
    it('500 when DB throws on list (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.audit_logs, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// notifications.js — lines 280-286, 303-304
// ═══════════════════════════════════════════════════════════════════

describe('notifications.js — uncovered branches', () => {
  beforeAll(async () => {
    if (!testMppPlanId) {
      const planRes = await request(app)
        .post('/api/maintenance-plans/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: testDeviceId,
          year: 2026,
          frequency: 'TRIMESTRIAL',
          responsibleName: 'Test Engineer',
        });
      testMppPlanId = planRes.body.id;
      cleanupMppPlanIds.push(testMppPlanId);
    }
  });

  describe('checkVerificationExpiry — more device states', () => {
    it('handles never-verified devices (requiresVerification=true, no verifications)', async () => {
      const deviceRes = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${token}`)
        .send({
          inventoryNumber: uniqueInv('UNV'),
          name: 'Never Verified Device',
          riskClass: 'IIa',
          sectionId: testSectionId,
        });
      if (deviceRes.status === 201) {
        cleanupDeviceIds.push(deviceRes.body.id);
        await prisma.devices.update({
          where: { id: deviceRes.body.id },
          data: { requiresVerification: true, verificationType: 'METROLOGIC', updatedAt: new Date() },
        });
      }

      await expect(checkVerificationExpiry()).resolves.not.toThrow();
    });

    it('handles verification expiring in 7 days', async () => {
      const sevenDays = new Date();
      sevenDays.setDate(sevenDays.getDate() + 7);

      const verif = await prisma.verifications.create({
        data: {
          deviceId: testDeviceId,
          type: 'METROLOGIC',
          performedAt: new Date(),
          validUntil: sevenDays,
          result: 'CONFORM',
          createdById: userId,
        },
      });

      await expect(checkVerificationExpiry()).resolves.not.toThrow();

      await prisma.verifications.deleteMany({ where: { id: verif.id } });
    });

    it('handles verification expiring in 60 days', async () => {
      const sixtyDays = new Date();
      sixtyDays.setDate(sixtyDays.getDate() + 60);

      const verif = await prisma.verifications.create({
        data: {
          deviceId: testDeviceId,
          type: 'METROLOGIC',
          performedAt: new Date(),
          validUntil: sixtyDays,
          result: 'CONFORM',
          createdById: userId,
        },
      });

      await expect(checkVerificationExpiry()).resolves.not.toThrow();

      await prisma.verifications.deleteMany({ where: { id: verif.id } });
    });
  });

  describe('checkMppDue — more device states', () => {
    it('detects occurrences with rescheduledTo', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const occurrence = await prisma.mpp_occurrences.create({
        data: {
          plan: { connect: { id: testMppPlanId } },
          deviceId: testDeviceId,
          scheduledDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          rescheduledTo: futureDate,
          status: 'PROGRAMAT',
        },
      });

      await expect(checkMppDue()).resolves.not.toThrow();

      await prisma.mpp_occurrences.deleteMany({ where: { id: occurrence.id } });
    });

    it('detects overdue occurrences via scheduledDate (no rescheduledTo)', async () => {
      const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      const occurrence = await prisma.mpp_occurrences.create({
        data: {
          plan: { connect: { id: testMppPlanId } },
          deviceId: testDeviceId,
          scheduledDate: pastDate,
          status: 'PROGRAMAT',
        },
      });

      await expect(checkMppDue()).resolves.not.toThrow();

      await prisma.mpp_occurrences.deleteMany({ where: { id: occurrence.id } });
    });
  });

  describe('checkRepairTickets — RIDICAT priority', () => {
    it('detects RIDICAT priority tickets older than 7 days', async () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const ticket = await prisma.repair_tickets.create({
        data: {
          deviceId: testDeviceId,
          ticketNumber: `TKT-RIDICAT-${Date.now()}`,
          faultDescription: 'High priority issue',
          reportedBy: 'Test User',
          priority: 'RIDICAT',
          status: 'IN_LUCRU',
          reportedAt: tenDaysAgo,
          updatedAt: new Date(),
        },
      });

      await expect(checkRepairTickets()).resolves.not.toThrow();

      await prisma.repair_tickets.deleteMany({ where: { id: ticket.id } });
    });
  });

  describe('generateComplianceSummary — more device states', () => {
    it('handles devices with expired verifications', async () => {
      const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const verif = await prisma.verifications.create({
        data: {
          deviceId: testDeviceId,
          type: 'METROLOGIC',
          performedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          validUntil: pastDate,
          result: 'CONFORM',
          createdById: userId,
        },
      });

      await expect(generateComplianceSummary()).resolves.not.toThrow();

      await prisma.verifications.deleteMany({ where: { id: verif.id } });
    });
  });

  describe('startCronJobs — error path (lines 303-304)', () => {
    it('returns handle and stop works', async () => {
      const handle = startCronJobs();
      expect(handle).toBeDefined();
      expect(typeof handle.stop).toBe('function');
      handle.stop();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// mppExecutions.js — lines 596, 610-617
// ═══════════════════════════════════════════════════════════════════

describe('mppExecutions.js — uncovered branches', () => {
  let executionId;

  beforeAll(async () => {
    const execRes = await request(app)
      .post('/api/mpp-executions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        executedDate: new Date().toISOString(),
        durationMinutes: 60,
        checklist: [
          { operatiune: 'Test op', bifat: true, nota: 'OK' },
        ],
        result: 'FUNCTIONAL',
        engineerName: 'Ing. Test Exec',
      });
    executionId = execRes.body.id;
  });

  describe('GET /api/mpp-executions/:id/formular6-pdf (lines 392-615)', () => {
    it('generates PDF for execution with notes', async () => {
      const res = await request(app)
        .get(`/api/mpp-executions/${executionId}/formular6-pdf`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
    });

    it('returns 400 for invalid id', async () => {
      const res = await request(app)
        .get('/api/mpp-executions/abc/formular6-pdf')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it('returns 404 for nonexistent execution', async () => {
      const res = await request(app)
        .get('/api/mpp-executions/999999/formular6-pdf')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it('500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.mpp_executions, 'findUnique').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/mpp-executions/1/formular6-pdf')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('mppExecutions.js — more error catches', () => {
    it('POST 500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .post('/api/mpp-executions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          deviceId: testDeviceId,
          executedDate: new Date().toISOString(),
          checklist: [{ operatiune: 'Test', bifat: true }],
          result: 'FUNCTIONAL',
          engineerName: 'Ing. Error',
        });
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });

    it('GET / 500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.mpp_executions, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/mpp-executions')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });

    it('GET /:id 500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.mpp_executions, 'findUnique').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/mpp-executions/1')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });

    it('DELETE 500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .delete(`/api/mpp-executions/${executionId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// annualInventory.js — error catches
// ═══════════════════════════════════════════════════════════════════

describe('annualInventory.js — uncovered branches', () => {
  describe('GET /api/annual-inventory/years — error catch', () => {
    it('returns years list', async () => {
      const res = await request(app)
        .get('/api/annual-inventory/years')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/annual-inventory/:year/status — error catch', () => {
    it('returns 400 for invalid year', async () => {
      const res = await request(app)
        .get('/api/annual-inventory/abc/status')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it('500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.sections, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/annual-inventory/2026/status')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('POST /api/annual-inventory/:year/section/:sectionId — error catch', () => {
    it('500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.annual_inventories, 'findFirst').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .post('/api/annual-inventory/2026/section/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [] });
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('DELETE /api/annual-inventory/:year/section/:sectionId — error catch', () => {
    it('500 when DB throws on transaction (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const spy = vi.spyOn(prisma, '$transaction');
      spy.mockResolvedValueOnce(null).mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .delete('/api/annual-inventory/2026/section/1')
        .set('Authorization', `Bearer ${token}`);
      expect([404, 500]).toContain(res.status);
      errSpy.mockRestore();
    });
  });

  describe('GET /api/annual-inventory/:year/discrepancies — error catch', () => {
    it('500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.inventory_check_items, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/annual-inventory/2026/discrepancies')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('POST /api/annual-inventory/:year/discrepancies/:id/verify — error catch', () => {
    it('500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.inventory_check_items, 'update').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .post('/api/annual-inventory/2026/discrepancies/1/verify')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });

  describe('GET /api/annual-inventory/:year/report-pdf — error catch', () => {
    it('returns 400 for invalid year', async () => {
      const res = await request(app)
        .get('/api/annual-inventory/abc/report-pdf')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it('500 when DB throws (spy)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(prisma.inventory_check_items, 'findMany').mockRejectedValueOnce(new Error('DB fail'));
      const res = await request(app)
        .get('/api/annual-inventory/2026/report-pdf')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
      errSpy.mockRestore();
    });
  });
});
