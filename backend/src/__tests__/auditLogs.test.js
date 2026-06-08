/**
 * Teste pentru audit trail — /api/audit-logs
 *
 * Verifică că audit logs sunt create corect pentru toate acțiunile (CRUD)
 * și că userId nu e null (H1 fix). Audit logs sunt read-only din perspectiva
 * API-ului (se creează automat la fiecare operație).
 */
const request = require('supertest');
const app = require('../index');
const prisma = require('../db');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

let token;
let userId;

beforeAll(async () => {
  // Login
  const loginRes = await request(app)
    .post('/api/auth/login?skip_ratelimit=true')
    .send({ username: 'testuser', password: TEST_PASSWORD });
  token = loginRes.body.accessToken;
  userId = loginRes.body.user.id;
});

describe('Audit logs — CREATE operații', () => {
  it('creare consumabil generează audit log cu userId', async () => {
    const res = await request(app)
      .post('/api/consumables')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Audit Test Consumable ${Date.now()}`,
        quantity: 50,
        minQuantity: 5,
      });
    expect(res.status).toBe(201);

    // Check audit log
    const auditLogs = await prisma.audit_logs.findMany({
      where: {
        entity: 'consumables',
        entityId: String(res.body.id),
        action: 'CREATE',
      },
    });
    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0].userId).toBe(userId); // KEY: userId trebuie setat
    expect(auditLogs[0].userId).not.toBeNull();
    expect(auditLogs[0].action).toBe('CREATE');

    // Cleanup
    await prisma.consumables.deleteMany({ where: { id: res.body.id } });
  });

  it('creare dispozitiv generează audit log cu userId', async () => {
    const res = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inventoryNumber: `AUD-${Date.now()}`,
        name: 'Audit Test Device',
        riskClass: 'I',
        sectionId: 1,
      });
    expect(res.status).toBe(201);

    // Check audit log
    const auditLogs = await prisma.audit_logs.findMany({
      where: {
        entity: 'Device',
        entityId: String(res.body.id),
        action: 'CREATE',
      },
    });
    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0].userId).toBe(userId);
    expect(auditLogs[0].userId).not.toBeNull();

    // Cleanup
    await prisma.incidents.deleteMany({ where: { deviceId: res.body.id } });
    await prisma.devices.deleteMany({ where: { id: res.body.id } });
  });
});

describe('Audit logs — UPDATE operații', () => {
  it('update consumabil generează audit log cu userId', async () => {
    // Create
    const createRes = await request(app)
      .post('/api/consumables')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Audit Test Update ${Date.now()}`,
        quantity: 100,
      });
    const consumableId = createRes.body.id;

    // Update
    const updateRes = await request(app)
      .put(`/api/consumables/${consumableId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 75 });
    expect(updateRes.status).toBe(200);

    // Check audit log for UPDATE
    const auditLogs = await prisma.audit_logs.findMany({
      where: {
        entity: 'consumables',
        entityId: String(consumableId),
        action: 'UPDATE',
      },
    });
    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0].userId).toBe(userId);
    expect(auditLogs[0].userId).not.toBeNull();

    // Cleanup
    await prisma.consumables.deleteMany({ where: { id: consumableId } });
  });

  it('update dispozitiv generează audit log cu userId și changes', async () => {
    // Create
    const createRes = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inventoryNumber: `AUD-UPD-${Date.now()}`,
        name: 'Test Device for Update',
        riskClass: 'I',
        sectionId: 1,
      });
    const deviceId = createRes.body.id;

    // Update
    const updateRes = await request(app)
      .put(`/api/devices/${deviceId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' });
    expect(updateRes.status).toBe(200);

    // Check audit log
    const auditLogs = await prisma.audit_logs.findMany({
      where: {
        entity: 'Device',
        entityId: String(deviceId),
        action: 'UPDATE',
      },
    });
    expect(auditLogs.length).toBeGreaterThan(0);
    const auditLog = auditLogs[0];
    expect(auditLog.userId).toBe(userId);
    expect(auditLog.userId).not.toBeNull();
    expect(auditLog.changes).toBeDefined();

    // Cleanup
    await prisma.incidents.deleteMany({ where: { deviceId } });
    await prisma.devices.deleteMany({ where: { id: deviceId } });
  });
});

describe('Audit logs — DELETE operații', () => {
  it('delete consumabil generează audit log cu userId', async () => {
    // Create
    const createRes = await request(app)
      .post('/api/consumables')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Audit Test Delete ${Date.now()}`,
        quantity: 10,
      });
    const consumableId = createRes.body.id;

    // Delete
    const deleteRes = await request(app)
      .delete(`/api/consumables/${consumableId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);

    // Check audit log for DELETE
    const auditLogs = await prisma.audit_logs.findMany({
      where: {
        entity: 'consumables',
        entityId: String(consumableId),
        action: 'DELETE',
      },
    });
    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0].userId).toBe(userId);
    expect(auditLogs[0].userId).not.toBeNull();
  });
});

describe('Audit logs — Timestamp și estructura', () => {
  it('audit log conține timestamp, entity, entityId, action', async () => {
    // Create consumable
    const res = await request(app)
      .post('/api/consumables')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Audit Log Structure Test ${Date.now()}`,
        quantity: 30,
      });
    const consumableId = res.body.id;

    // Query audit log
    const auditLog = await prisma.audit_logs.findFirst({
      where: {
        entity: 'consumables',
        entityId: String(consumableId),
      },
    });
    expect(auditLog).toBeDefined();
    expect(auditLog.userId).toBe(userId);
    expect(auditLog.action).toBe('CREATE');
    expect(auditLog.entity).toBe('consumables');
    expect(auditLog.entityId).toBe(String(consumableId));
    expect(auditLog.timestamp).toBeInstanceOf(Date);

    // Cleanup
    await prisma.consumables.deleteMany({ where: { id: consumableId } });
  });
});

describe('Audit logs — H1 verification across multiple routes', () => {
  it('toate rutele setează userId corect (nu null)', async () => {
    // Test multiple entities
    const entities = [];

    // Create consumable
    const consumRes = await request(app)
      .post('/api/consumables')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `H1 Test ${Date.now()}`, quantity: 5 });
    if (consumRes.status === 201) entities.push({ id: consumRes.body.id, entity: 'consumables' });

    // Create device
    const devRes = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inventoryNumber: `H1-${Date.now()}`,
        name: 'H1 Test Device',
        riskClass: 'II',
        sectionId: 1,
      });
    if (devRes.status === 201) entities.push({ id: devRes.body.id, entity: 'Device' });

    // Verify all have userId
    for (const ent of entities) {
      const logs = await prisma.audit_logs.findMany({
        where: { entity: ent.entity, entityId: String(ent.id) },
      });
      for (const log of logs) {
        expect(log.userId).toBe(userId);
        expect(log.userId).not.toBeNull();
      }
    }

    // Cleanup
    await prisma.consumables.deleteMany({ where: { id: entities[0]?.id } });
    if (entities[1]?.id) {
      await prisma.incidents.deleteMany({ where: { deviceId: entities[1].id } });
    }
    await prisma.devices.deleteMany({ where: { id: entities[1]?.id } });
  });
});
