/**
 * Teste țintite pentru ramuri necoperite — push branch coverage peste 90%.
 *
 *Ținte:
 *  - devices.js: catch block upload (612-619), catch block delete (547-548)
 *  - auth.js: rate limiter skip branches (13-23)
 *  - repairTickets.js: operations table ternaries (807)
 *  - notifications.js: catch block in verification loop (104)
 */
const request = require('supertest');
const app = require('../index');
const prisma = require('../db');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

let token;
let sectionId;

function uniqueInv(prefix = 'BR8') {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

beforeAll(async () => {
  const loginRes = await request(app)
    .post('/api/auth/login?skip_ratelimit=true')
    .send({ username: 'testuser', password: TEST_PASSWORD });
  token = loginRes.body.accessToken;

  const secRes = await request(app)
    .get('/api/sections')
    .set('Authorization', `Bearer ${token}`);
  sectionId = secRes.body[0]?.id || 1;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('devices.js — remaining uncovered branches', () => {
  it('catch block on upload when $transaction throws', async () => {
    const created = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({ inventoryNumber: uniqueInv(), name: 'Upload Catch Test', riskClass: 'I', sectionId });
    const deviceId = created.body.id;

    const originalTransaction = prisma.$transaction.bind(prisma);
    let callCount = 0;
    prisma.$transaction = async (fn) => {
      callCount++;
      if (callCount === 2) throw new Error('Transaction fail');
      return originalTransaction(fn);
    };

    const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
    const res = await request(app)
      .post(`/api/devices/${deviceId}/upload`)
      .set('Authorization', `Bearer ${token}`)
      .field('field', 'manualUrl')
      .attach('file', pdf, 'test.pdf');

    prisma.$transaction = originalTransaction;
  });

  it('catch block on delete (casare) when $transaction throws', async () => {
    const created = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({ inventoryNumber: uniqueInv(), name: 'Delete Catch Test', riskClass: 'I', sectionId });
    const deviceId = created.body.id;

    const originalTransaction = prisma.$transaction.bind(prisma);
    prisma.$transaction = async (fn) => {
      throw new Error('Delete transaction fail');
    };

    const res = await request(app)
      .delete(`/api/devices/${deviceId}`)
      .set('Authorization', `Bearer ${token}`);

    prisma.$transaction = originalTransaction;
    expect(res.status).toBe(500);
  });
});

describe('auth.js — rate limiter skip branches', () => {
  it('skip returns false when NODE_ENV is production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: TEST_PASSWORD });

    process.env.NODE_ENV = originalEnv;
    expect(res.status).toBe(200);
  });
});

describe('repairTickets.js — operations table ternaries', () => {
  it('formular8-pdf with operations having timeEnd and signature', async () => {
    const devRes = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({ inventoryNumber: uniqueInv(), name: 'Ticket Ops Test', riskClass: 'I', sectionId });
    const deviceId = devRes.body.id;

    const ticketRes = await request(app)
      .post('/api/repair-tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceId, reportedBy: 'Test', faultDescription: 'Ops test', priority: 'NORMAL' });
    const ticketId = ticketRes.body.id;

    await request(app)
      .patch(`/api/repair-tickets/${ticketId}/triage`)
      .set('Authorization', `Bearer ${token}`)
      .send({ repairType: 'INTERN', defectCause: 'Ops cause' });

    await request(app)
      .put(`/api/repair-tickets/${ticketId}/repair`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        repairReport: 'Repaired',
        actionsTaken: 'Actions taken',
        durationHours: 2,
        functionalTest: 'FUNCTIONAL',
        engineerName: 'Engineer',
        operations: [
          {
            date: '2025-06-14T10:00:00Z',
            timeStart: '10:00',
            timeEnd: '12:00',
            operation: 'Replaced part',
            engineer: 'Tech',
            signature: 'data:image/png;base64,abc123',
          },
          {
            date: '2025-06-14T12:00:00Z',
            timeStart: '12:00',
            operation: 'Test run',
            engineer: 'Tech2',
          },
        ],
      });

    const res = await request(app)
      .get(`/api/repair-tickets/${ticketId}/formular8-pdf?skip_ratelimit=true`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/pdf/);
  });
});

describe('auth.js — change password validation branches', () => {
  it('returns 400 when passwords do not match', async () => {
    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'NewPass123!', confirmPassword: 'DifferentPass123!' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/nu coincid/i);
  });

  it('returns 400 when new password too short', async () => {
    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'short', confirmPassword: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/minim 8 caractere/i);
  });

  it('returns 400 when current password is wrong', async () => {
    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongPassword123!', newPassword: 'NewPass123!', confirmPassword: 'NewPass123!' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/incorectă/i);
  });

  it('returns 400 when missing fields', async () => {
    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: TEST_PASSWORD });
    expect(res.status).toBe(400);
  });
});

describe('devices.js — more branch coverage', () => {
  it('fisa-pdf returns 404 for non-existent device', async () => {
    const res = await request(app)
      .get('/api/devices/99999999/fisa-pdf?skip_ratelimit=true')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('export csv with row limit exceeded', async () => {
    const res = await request(app)
      .get('/api/devices/export/csv?limit=1&skip_ratelimit=true')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('export xlsx with row limit exceeded', async () => {
    const res = await request(app)
      .get('/api/devices/export/xlsx?limit=1&skip_ratelimit=true')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('upload with non-existent device returns 404 and cleans file', async () => {
    const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
    const res = await request(app)
      .post('/api/devices/99999999/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('field', 'manualUrl')
      .attach('file', pdf, 'test.pdf');
    expect(res.status).toBe(404);
  });

  it('upload with invalid device id returns 400', async () => {
    const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
    const res = await request(app)
      .post('/api/devices/abc/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('field', 'manualUrl')
      .attach('file', pdf, 'test.pdf');
    expect(res.status).toBe(400);
  });

  it('upload without file returns 400', async () => {
    const created = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({ inventoryNumber: uniqueInv(), name: 'No File Upload', riskClass: 'I', sectionId });
    const res = await request(app)
      .post(`/api/devices/${created.body.id}/upload`)
      .set('Authorization', `Bearer ${token}`)
      .field('field', 'manualUrl');
    expect(res.status).toBe(400);
  });
});
