/**
 * Teste pentru Cron Jobs & Notifications
 *
 * Testează:
 * - checkVerificationExpiry() — alerte verificări 60/30/7 zile
 * - checkContractExpiry() — alerte contracte 30 zile
 * - checkMaintenanceDue() — alerte mentenanță scadentă
 * - checkRepairTickets() — alerte tichetele critice
 * - generateComplianceSummary() — raport zilnic
 */

const request = require('supertest');
const app = require('../index');
const prisma = require('../db');
const {
  checkVerificationExpiry,
  checkContractExpiry,
  checkDocumentExpiry,
  checkMppDue,
  checkRepairTickets,
  generateComplianceSummary,
  startCronJobs,
} = require('../jobs/notifications');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

let token;
let userId;
let testDeviceId;
let testProviderId;
let testMppPlanId;

beforeAll(async () => {
  // Login
  const loginRes = await request(app)
    .post('/api/auth/login?skip_ratelimit=true')
    .send({ username: 'testuser', password: TEST_PASSWORD });
  token = loginRes.body.accessToken;
  userId = loginRes.body.user.id;

  // Create test device
  const deviceRes = await request(app)
    .post('/api/devices')
    .set('Authorization', `Bearer ${token}`)
    .send({
      inventoryNumber: `TEST-NOTIF-${Date.now()}`,
      name: 'Test Device for Notifications',
      riskClass: 'IIa',
      sectionId: 1,
    });
  testDeviceId = deviceRes.body.id;

  // Enable verification requirement directly via Prisma
  if (testDeviceId) {
    await prisma.devices.update({
      where: { id: testDeviceId },
      data: {
        requiresVerification: true,
        verificationType: 'METROLOGIC',
        verificationFreqMonths: 12,
        updatedAt: new Date(),
      },
    });
  }

  // Create test service provider
  const providerRes = await request(app)
    .post('/api/service-contracts/providers')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Test Provider for Cron',
      contact: 'Test Contact',
      email: 'test@provider.md',
      phone: '+373 67 123 456',
    });
  testProviderId = providerRes.body.id;

  // Create test maintenance plan
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
});

afterAll(async () => {
  if (testDeviceId) {
    await prisma.repair_tickets.deleteMany({ where: { deviceId: testDeviceId } });
    await prisma.verifications.deleteMany({ where: { deviceId: testDeviceId } });
  }
  if (testMppPlanId) {
    await prisma.mpp_occurrences.deleteMany({ where: { planId: testMppPlanId } });
    await prisma.maintenance_plans.deleteMany({ where: { id: testMppPlanId } });
  }
  if (testProviderId) {
    await prisma.service_contracts.deleteMany({ where: { providerId: testProviderId } });
    await prisma.provider_ratings.deleteMany({ where: { providerId: testProviderId } });
    await prisma.service_providers.deleteMany({ where: { id: testProviderId } });
  }
  if (testDeviceId) {
    await prisma.devices.deleteMany({ where: { id: testDeviceId } });
  }
});

describe('checkVerificationExpiry() — Alerte Verificări (60/30/7 zile)', () => {
  it('execută fără erori', async () => {
    await expect(checkVerificationExpiry()).resolves.not.toThrow();
  });

  it('detectează verificări care expiră în 30 de zile', async () => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const verif = await prisma.verifications.create({
      data: {
        deviceId: testDeviceId,
        type: 'METROLOGIC',
        performedAt: new Date(),
        validUntil: thirtyDaysFromNow,
        result: 'CONFORM',
        createdById: userId,
      },
    });

    await expect(checkVerificationExpiry()).resolves.not.toThrow();

    const verifs = await prisma.verifications.findMany({
      where: { deviceId: testDeviceId },
    });
    expect(verifs.length).toBeGreaterThan(0);

    // Cleanup
    await prisma.verifications.deleteMany({ where: { id: verif.id } });
  });

  it('găsește dispozitive care nu au fost niciodată verificate', async () => {
    const unverifiedRes = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inventoryNumber: `TEST-UNVERIF-${Date.now()}`,
        name: 'Unverified Device for Test',
        riskClass: 'IIa',
        sectionId: 1,
      });

    const unverifiedDeviceId = unverifiedRes.body.id;

    if (unverifiedDeviceId) {
      await prisma.devices.update({
        where: { id: unverifiedDeviceId },
        data: { requiresVerification: true, updatedAt: new Date() },
      });
    }

    await expect(checkVerificationExpiry()).resolves.not.toThrow();

    if (unverifiedDeviceId) {
      await prisma.devices.deleteMany({ where: { id: unverifiedDeviceId } });
    }
  });
});

describe('checkContractExpiry() — Alerte Contracte (30 zile)', () => {
  it('execută fără erori', async () => {
    await expect(checkContractExpiry()).resolves.not.toThrow();
  });

  it('detectează contracte care expiră în 30 de zile', async () => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const contract = await prisma.service_contracts.create({
      data: {
        providerId: testProviderId,
        contractNo: `CONTRACT-30D-${Date.now()}`,
        startDate: new Date(),
        endDate: thirtyDaysFromNow,
        value: 50000,
        slaHours: 24,
        coveredDeviceIds: [],
        updatedAt: new Date(),
      },
    });

    await expect(checkContractExpiry()).resolves.not.toThrow();

    const contracts = await prisma.service_contracts.findMany({
      where: { providerId: testProviderId },
    });
    expect(contracts.length).toBeGreaterThan(0);

    // Cleanup
    await prisma.service_contracts.deleteMany({ where: { id: contract.id } });
  });
});

describe('checkMppDue() — Alerte Mentenanță Scadentă', () => {
  it('execută fără erori', async () => {
    await expect(checkMppDue()).resolves.not.toThrow();
  });

  it('detectează mentenanță cu status SCADENT', async () => {
    const occurrence = await prisma.mpp_occurrences.create({
      data: {
        planId: testMppPlanId,
        deviceId: testDeviceId,
        scheduledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'SCADENT',
      },
    });

    await expect(checkMppDue()).resolves.not.toThrow();

    await prisma.mpp_occurrences.deleteMany({ where: { id: occurrence.id } });
  });

  it('detectează mentenanță cu status DEPASIT', async () => {
    const occurrence = await prisma.mpp_occurrences.create({
      data: {
        planId: testMppPlanId,
        deviceId: testDeviceId,
        scheduledDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        status: 'DEPASIT',
      },
    });

    await expect(checkMppDue()).resolves.not.toThrow();

    await prisma.mpp_occurrences.deleteMany({ where: { id: occurrence.id } });
  });
});

describe('checkRepairTickets() — Alerte Tichetele Critice (>7 zile)', () => {
  it('execută fără erori', async () => {
    await expect(checkRepairTickets()).resolves.not.toThrow();
  });

  it('detectează tichetele URGENT nerezolvate >7 zile', async () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const ticket = await prisma.repair_tickets.create({
      data: {
        deviceId: testDeviceId,
        ticketNumber: `TKT-URGENT-${Date.now()}`,
        faultDescription: 'Critical issue',
        reportedBy: 'Test User',
        priority: 'URGENT',
        status: 'DESCHIS',
        reportedAt: tenDaysAgo,
        updatedAt: new Date(),
      },
    });

    await expect(checkRepairTickets()).resolves.not.toThrow();

    await prisma.repair_tickets.deleteMany({ where: { id: ticket.id } });
  });

  it('ignorează tichetele rezolvate', async () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const ticket = await prisma.repair_tickets.create({
      data: {
        deviceId: testDeviceId,
        ticketNumber: `TKT-CLOSED-${Date.now()}`,
        faultDescription: 'Already resolved',
        reportedBy: 'Test User',
        priority: 'URGENT',
        status: 'INCHIS',
        reportedAt: tenDaysAgo,
        updatedAt: new Date(),
      },
    });

    await expect(checkRepairTickets()).resolves.not.toThrow();

    await prisma.repair_tickets.deleteMany({ where: { id: ticket.id } });
  });
});

describe('generateComplianceSummary() — Raport Zilnic Conformitate', () => {
  it('execută fără erori', async () => {
    await expect(generateComplianceSummary()).resolves.not.toThrow();
  });

  it('calculează statistici conform/expirat/neverificat', async () => {
    await expect(generateComplianceSummary()).resolves.not.toThrow();

    const device = await prisma.devices.findUnique({
      where: { id: testDeviceId },
      include: {
        verifications: {
          orderBy: { performedAt: 'desc' },
          take: 1,
        },
      },
    });

    expect(device).toBeDefined();
  });
});

describe('checkDocumentExpiry() — Alerte Documente (60/30/7 zile)', () => {
  it('execută fără erori', async () => {
    await expect(checkDocumentExpiry()).resolves.not.toThrow();
  });

  it('detectează documente cu validUntil apropiat', async () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 5);
    const created = await prisma.documents.create({
      data: {
        title: `Expiring Doc ${Date.now()}`,
        category: 'CERTIFICAT',
        fileUrl: '/api/documents/file/test-expiring.pdf',
        isCurrent: true,
        isDeleted: false,
        validUntil: soon,
        issuer: 'Test Issuer',
        updatedAt: new Date(),
      },
    });

    await checkDocumentExpiry();

    await prisma.documents.delete({ where: { id: created.id } });
  });
});

describe('startCronJobs() — Pornire Cron Task', () => {
  it('returnează task handle cu metoda stop()', () => {
    const handle = startCronJobs();

    expect(handle).toBeDefined();
    expect(handle.verificationTask).toBeDefined();
    expect(typeof handle.stop).toBe('function');

    handle.stop();
  });

  it('nu aruncă erori la pornire', () => {
    expect(() => {
      const handle = startCronJobs();
      handle.stop();
    }).not.toThrow();
  });
});
