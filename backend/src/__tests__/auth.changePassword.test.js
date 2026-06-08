/**
 * Teste pentru PATCH /api/auth/change-password
 *
 * Acoperă toate ramurile din endpoints-ul de schimbare parolă:
 *   - 401 fără token (rută protejată)
 *   - 400 câmpuri lipsă
 *   - 400 parole care nu coincid
 *   - 400 parolă nouă prea scurtă (< 8 caractere)
 *   - 400 parolă curentă incorectă
 *   - 200 schimbare reușită (cu restaurare parolă)
 *   - 500 eroare DB (spy pe $transaction)
 */
const request = require('supertest');
const app = require('../index');
const prisma = require('../db');

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';
const CP_EMAIL = 'cp-test@simdm.local';
const CP_USERNAME = 'cptestuser';

let token;

async function login(username = CP_USERNAME, password = TEST_PASSWORD) {
  return request(app)
    .post('/api/auth/login?skip_ratelimit=true')
    .send({ username, password });
}

beforeAll(async () => {
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash(TEST_PASSWORD, 12);
  await prisma.users.upsert({
    where: { email: CP_EMAIL },
    update: { passwordHash: hash, isActive: true, failedLoginAttempts: 0, lockedUntil: null },
    create: {
      email: CP_EMAIL,
      username: CP_USERNAME,
      passwordHash: hash,
      fullName: 'CP Test User',
      role: 'BIOINGINER',
      isActive: true,
      failedLoginAttempts: 0,
      updatedAt: new Date(),
    },
  });
  const res = await login();
  token = res.body.accessToken;
});

afterAll(async () => {
  const cpUser = await prisma.users.findUnique({ where: { email: CP_EMAIL } });
  if (cpUser) {
    await prisma.refresh_tokens.deleteMany({ where: { userId: cpUser.id } });
    await prisma.users.delete({ where: { id: cpUser.id } });
  }
});

describe('PATCH /api/auth/change-password — autorizare', () => {
  it('returnează 401 fără header Authorization', async () => {
    const res = await request(app)
      .patch('/api/auth/change-password')
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'NewPass123!', confirmPassword: 'NewPass123!' });
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/auth/change-password — validare câmpuri', () => {
  it('returnează 400 când lipsesc câmpuri obligatorii', async () => {
    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: TEST_PASSWORD });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/obligatorii/i);
  });

  it('returnează 400 când newPassword și confirmPassword nu coincid', async () => {
    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'NewPass123!', confirmPassword: 'AltaParola!' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/coincid/i);
  });

  it('returnează 400 când parola nouă are mai puțin de 8 caractere', async () => {
    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'Scrt1!', confirmPassword: 'Scrt1!' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/minim 8/i);
  });

  it('returnează 400 pentru parolă curentă incorectă', async () => {
    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'ParolaCompletGresita!', newPassword: 'NewPass123!', confirmPassword: 'NewPass123!' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/curentă incorectă/i);
  });
});

describe('PATCH /api/auth/change-password — succes', () => {
  it('schimbă parola cu succes și returnează mesaj în română', async () => {
    const newPassword = 'NewPass456!';
    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: TEST_PASSWORD, newPassword, confirmPassword: newPassword });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/succes/i);

    // Restaurează parola originală pentru alte teste
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(TEST_PASSWORD, 12);
    await prisma.users.update({ where: { email: CP_EMAIL }, data: { passwordHash: hash } });
    // Regenerează token după restaurare
    const loginRes = await login();
    token = loginRes.body.accessToken;
  });
});

describe('PATCH /api/auth/change-password — erori DB', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returnează 404 când utilizatorul din token nu mai există în DB', async () => {
    vi.spyOn(prisma.users, 'findUnique').mockResolvedValueOnce(null);

    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'NewPass123!', confirmPassword: 'NewPass123!' });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/nu găsit/i);
  });

  it('returnează 500 când $transaction aruncă', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('DB fail'));

    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'NewPass123!', confirmPassword: 'NewPass123!' });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Eroare la schimbarea parolei/i);
    errSpy.mockRestore();
  });
});
