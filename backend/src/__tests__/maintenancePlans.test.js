/**
 * Teste pentru modulul Plan Mentenanță Preventivă — /api/maintenance-plans
 *
 * Testează:
 * - Generator plan cu mapare frecvență → luni
 * - Calendar cu status dinamic (PROGRAMAT/SCADENT/DEPASIT/EFECTUAT)
 * - Reprogramare cu validare motiv (min 5 caractere)
 * - PDF Formular Nr. 5
 * - Audit log cu userId ne-null
 */
const request = require('supertest');
const app = require('../index');
const prisma = require('../db');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

let token;
let userId;
let testDeviceId;

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
      inventoryNumber: `TEST-MPP-${Date.now()}`,
      name: 'Test Device for MPP',
      riskClass: 'IIa',
      sectionId: 1,
    });
  testDeviceId = deviceRes.body.id;
});

afterAll(async () => {
  // Cleanup
  if (testDeviceId) {
    const plans = await prisma.maintenance_plans.findMany({ where: { deviceId: testDeviceId } });
    for (const plan of plans) {
      await prisma.mpp_occurrences.deleteMany({ where: { planId: plan.id } });
    }
    await prisma.maintenance_plans.deleteMany({ where: { deviceId: testDeviceId } });
    await prisma.devices.deleteMany({ where: { id: testDeviceId } });
  }
});

describe('POST /api/maintenance-plans/generate — Generator Plan', () => {
  it('fără token -> 401', async () => {
    const res = await request(app).post('/api/maintenance-plans/generate').send({});
    expect(res.status).toBe(401);
  });

  it('crează plan și ocurențe corecte pentru LUNAR (12 ocurențe)', async () => {
    const res = await request(app)
      .post('/api/maintenance-plans/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        year: 2026,
        frequency: 'LUNAR',
        responsibleName: 'Ing. Test',
        responsibleAffil: 'Bioinginerie',
      });
    expect(res.status).toBe(201);
    expect(res.body.frequency).toBe('LUNAR');
    expect(res.body.months).toHaveLength(12);
    expect(res.body.occurrenceCount).toBe(12);
  });

  it('crează plan TRIMESTRIAL (4 ocurențe: luna 3, 6, 9, 12)', async () => {
    const res = await request(app)
      .post('/api/maintenance-plans/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        year: 2027,
        frequency: 'TRIMESTRIAL',
        responsibleName: 'Ing. Test',
      });
    expect(res.status).toBe(201);
    expect(res.body.months).toEqual([3, 6, 9, 12]);
    expect(res.body.occurrenceCount).toBe(4);
  });

  it('crează plan SEMESTRIAL (2 ocurențe: luna 6, 12)', async () => {
    const res = await request(app)
      .post('/api/maintenance-plans/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        year: 2028,
        frequency: 'SEMESTRIAL',
        responsibleName: 'Ing. Test',
      });
    expect(res.status).toBe(201);
    expect(res.body.months).toEqual([6, 12]);
  });

  it('crează plan ANUAL (1 ocurență: luna 12)', async () => {
    const res = await request(app)
      .post('/api/maintenance-plans/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        year: 2029,
        frequency: 'ANUAL',
        responsibleName: 'Ing. Test',
      });
    expect(res.status).toBe(201);
    expect(res.body.months).toEqual([12]);
    expect(res.body.occurrenceCount).toBe(1);
  });

  it('validează că deviceId este obligatoriu', async () => {
    const res = await request(app)
      .post('/api/maintenance-plans/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        year: 2026,
        frequency: 'LUNAR',
        responsibleName: 'Ing. Test',
      });
    expect(res.status).toBe(400);
  });

  it('validează că frecvență trebuie să fie validă', async () => {
    const res = await request(app)
      .post('/api/maintenance-plans/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        year: 2026,
        frequency: 'INVALID',
        responsibleName: 'Ing. Test',
      });
    expect(res.status).toBe(400);
  });

  it('crează audit log cu userId ne-null', async () => {
    const res = await request(app)
      .post('/api/maintenance-plans/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        year: 2030,
        frequency: 'LUNAR',
        responsibleName: 'Ing. Test',
      });
    expect(res.status).toBe(201);

    const auditLogs = await prisma.audit_logs.findMany({
      where: {
        entity: 'maintenance_plans',
        entityId: String(res.body.id),
      },
    });
    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0].userId).toBe(userId);
    expect(auditLogs[0].userId).not.toBeNull();
  });
});

describe('GET /api/maintenance-plans/calendar — Calendar cu Status Dinamic', () => {
  let planId;

  beforeAll(async () => {
    // Create a plan first
    const res = await request(app)
      .post('/api/maintenance-plans/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        year: 2026,
        frequency: 'TRIMESTRIAL',
        responsibleName: 'Ing. Test',
      });
    planId = res.body.id;
  });

  it('returnează ocurențe cu status calculat dinamic', async () => {
    const res = await request(app)
      .get('/api/maintenance-plans/calendar?year=2026')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.year).toBe(2026);

    // Verify each occurrence has a status
    res.body.data.forEach((occ) => {
      expect(['PROGRAMAT', 'SCADENT', 'DEPASIT', 'EFECTUAT']).toContain(occ.status);
    });
  });

  it('returnează ocurențe pentru year default (curent)', async () => {
    const res = await request(app)
      .get('/api/maintenance-plans/calendar')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.year).toBe(2026); // Current year in tests
  });
});

describe('GET /api/maintenance-plans/:id — Detalii Plan', () => {
  let planId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/maintenance-plans/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        year: 2031,
        frequency: 'BIMESTRIAL',
        responsibleName: 'Ing. Test',
        responsibleAffil: 'Dept. Bioinginerie',
      });
    planId = res.body.id;
  });

  it('returnează detaliile planului cu ocurențe', async () => {
    const res = await request(app)
      .get(`/api/maintenance-plans/${planId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(planId);
    expect(res.body.frequency).toBe('BIMESTRIAL');
    expect(Array.isArray(res.body.occurrences)).toBe(true);
    expect(res.body.occurrences.length).toBe(6); // BIMESTRIAL = 6 occurrences
  });

  it('ocurențele conțin status calculat', async () => {
    const res = await request(app)
      .get(`/api/maintenance-plans/${planId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    res.body.occurrences.forEach((occ) => {
      expect(['PROGRAMAT', 'SCADENT', 'DEPASIT', 'EFECTUAT']).toContain(occ.status);
    });
  });

  it('returnează 404 pentru plan inexistent', async () => {
    const res = await request(app)
      .get('/api/maintenance-plans/999999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('generează apariții cu preferredTime setat (14:30 → ora 14)', async () => {
    const res = await request(app)
      .post('/api/maintenance-plans/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        year: 2033,
        frequency: 'LUNAR',
        responsibleName: 'Ing. Ora Test',
        preferredTime: '14:30',
      });
    expect(res.status).toBe(201);

    const detailsRes = await request(app)
      .get(`/api/maintenance-plans/${res.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(detailsRes.status).toBe(200);

    detailsRes.body.occurrences.forEach((occ) => {
      const d = new Date(occ.scheduledDate);
      expect(d.getUTCHours()).toBe(14);
      expect(d.getUTCMinutes()).toBe(30);
    });
  });

  it('folosește ora implicită 09:00 când preferredTime nu e specificat', async () => {
    const res = await request(app)
      .post('/api/maintenance-plans/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        year: 2034,
        frequency: 'LUNAR',
        responsibleName: 'Ing. Default',
      });
    expect(res.status).toBe(201);

    const detailsRes = await request(app)
      .get(`/api/maintenance-plans/${res.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    detailsRes.body.occurrences.forEach((occ) => {
      const d = new Date(occ.scheduledDate);
      expect(d.getUTCHours()).toBe(9);
      expect(d.getUTCMinutes()).toBe(0);
    });
  });
});

describe('PATCH /api/maintenance-plans/occurrence/:id/reschedule — Reprogramare', () => {
  let occurrenceId;

  beforeAll(async () => {
    const planRes = await request(app)
      .post('/api/maintenance-plans/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        year: 2032,
        frequency: 'LUNAR',
        responsibleName: 'Ing. Test',
      });

    const detailsRes = await request(app)
      .get(`/api/maintenance-plans/${planRes.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    occurrenceId = detailsRes.body.occurrences[0].id;
  });

  it('reprogramează ocurență cu motiv valid (min 5 caractere)', async () => {
    const newDate = new Date('2026-04-20').toISOString();
    const res = await request(app)
      .patch(`/api/maintenance-plans/occurrence/${occurrenceId}/reschedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        newDate,
        reason: 'Bioinginerul nu era disponibil',
      });
    expect(res.status).toBe(200);
    expect(res.body.rescheduleReason).toBe('Bioinginerul nu era disponibil');
    expect(new Date(res.body.rescheduledTo).toISOString()).toBe(newDate);
  });

  it('păstrează ora exactă la reprogramare cu datetime', async () => {
    const newDateTime = new Date('2026-05-10T15:45:00.000Z');
    const res = await request(app)
      .patch(`/api/maintenance-plans/occurrence/${occurrenceId}/reschedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        newDate: newDateTime.toISOString(),
        reason: 'Reprogramare cu oră specifică pentru test',
      });
    expect(res.status).toBe(200);
    const rescheduled = new Date(res.body.rescheduledTo);
    expect(rescheduled.getUTCHours()).toBe(15);
    expect(rescheduled.getUTCMinutes()).toBe(45);
  });

  it('respinge reprogramare fără motiv', async () => {
    const res = await request(app)
      .patch(`/api/maintenance-plans/occurrence/${occurrenceId}/reschedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        newDate: new Date().toISOString(),
        reason: '',
      });
    expect(res.status).toBe(400);
  });

  it('respinge reprogramare cu motiv < 5 caractere', async () => {
    const res = await request(app)
      .patch(`/api/maintenance-plans/occurrence/${occurrenceId}/reschedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        newDate: new Date().toISOString(),
        reason: 'test',
      });
    expect(res.status).toBe(400);
  });

  it('crează audit log la reprogramare', async () => {
    const newDate = new Date('2026-05-15').toISOString();
    const res = await request(app)
      .patch(`/api/maintenance-plans/occurrence/${occurrenceId}/reschedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        newDate,
        reason: 'Doctor din secție indisponibil',
      });
    expect(res.status).toBe(200);

    const auditLogs = await prisma.audit_logs.findMany({
      where: {
        entity: 'mpp_occurrences',
        entityId: String(occurrenceId),
        action: 'UPDATE',
      },
    });
    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0].userId).toBe(userId);
    expect(auditLogs[0].userId).not.toBeNull();
  });

  it('ocurență reprogramată într-un alt an apare în calendarul anului nou, nu în cel vechi', async () => {
    const planRes = await request(app)
      .post('/api/maintenance-plans/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        year: 2040,
        frequency: 'ANUAL',
        responsibleName: 'Ing. Test',
      });

    const detailsRes = await request(app)
      .get(`/api/maintenance-plans/${planRes.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    const decOccurrenceId = detailsRes.body.occurrences[0].id;

    await request(app)
      .patch(`/api/maintenance-plans/occurrence/${decOccurrenceId}/reschedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        newDate: new Date('2041-01-10').toISOString(),
        reason: 'Reprogramat peste pragul de an',
      });

    const oldYearCalendar = await request(app)
      .get('/api/maintenance-plans/calendar?year=2040')
      .set('Authorization', `Bearer ${token}`);
    expect(oldYearCalendar.body.data.find((o) => o.id === decOccurrenceId)).toBeUndefined();

    const newYearCalendar = await request(app)
      .get('/api/maintenance-plans/calendar?year=2041')
      .set('Authorization', `Bearer ${token}`);
    expect(newYearCalendar.body.data.find((o) => o.id === decOccurrenceId)).toBeDefined();
  });
});

describe('GET /api/maintenance-plans/:year/formular5-pdf — PDF Generation', () => {
  beforeAll(async () => {
    // Create a plan for PDF generation
    await request(app)
      .post('/api/maintenance-plans/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceId: testDeviceId,
        year: 2033,
        frequency: 'TRIMESTRIAL',
        responsibleName: 'Ing. PDF Test',
      });
  });

  it('generează PDF pentru un an cu planuri', async () => {
    const res = await request(app)
      .get('/api/maintenance-plans/2033/formular5-pdf')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('returnează 404 pentru an fără planuri', async () => {
    const res = await request(app)
      .get('/api/maintenance-plans/2090/formular5-pdf')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('validează că year este valid (numeric)', async () => {
    const res = await request(app)
      .get('/api/maintenance-plans/invalid/formular5-pdf')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
