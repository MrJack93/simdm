/**
 * Teste unitare pentru AuthService (src/services/authService.js)
 *
 * Testează direct metodele statice ale clasei, fără stratul HTTP:
 *   - generateAccessToken()  — semnare JWT HS256, payload corect
 *   - hashToken()            — SHA256 determinist
 *   - generateRefreshToken() — persistă token hash-uit în refresh_tokens
 *   - login()                — succes, user inexistent, parolă greșită, lockout
 *   - refreshAccessToken()   — rotație + detecție reutilizare token revocat
 *   - logout()               — revocă refresh token
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const AuthService = require('../services/authService');
const prisma = require('../db');

const TEST_EMAIL = 'test@simdm.local';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!';

// Request fals minimal, suficient pentru metodele AuthService
function fakeReq(ip = '127.0.0.1') {
  return {
    ip,
    headers: { 'user-agent': 'vitest-suite' },
  };
}

async function getTestUser() {
  return prisma.users.findUnique({ where: { email: TEST_EMAIL } });
}

async function resetTestUserLock() {
  await prisma.users.update({
    where: { email: TEST_EMAIL },
    data: { failedLoginAttempts: 0, lockedUntil: null, isActive: true },
  });
}

describe('AuthService.generateAccessToken', () => {
  it('produce un JWT valid cu sub, username și role', async () => {
    const user = await getTestUser();
    const token = AuthService.generateAccessToken(user);
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
    expect(decoded.sub).toBe(user.id);
    expect(decoded.username).toBe(user.username);
    expect(decoded.role).toBe(user.role);
  });

  it('setează un termen de expirare (exp > iat)', async () => {
    const user = await getTestUser();
    const token = AuthService.generateAccessToken(user);
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    expect(decoded.exp).toBeGreaterThan(decoded.iat);
  });

  it('semnează cu HS256 (verificarea cu altă cheie eșuează)', async () => {
    const user = await getTestUser();
    const token = AuthService.generateAccessToken(user);
    expect(() => jwt.verify(token, 'cheie_gresita')).toThrow();
  });
});

describe('AuthService.hashToken', () => {
  it('produce un hash SHA256 de 64 caractere hex', () => {
    const hash = AuthService.hashToken('un-token-oarecare');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('este determinist (aceeași intrare -> același hash)', () => {
    expect(AuthService.hashToken('abc')).toBe(AuthService.hashToken('abc'));
  });

  it('produce hash-uri diferite pentru intrări diferite', () => {
    expect(AuthService.hashToken('abc')).not.toBe(AuthService.hashToken('abd'));
  });

  it('corespunde cu calculul standard crypto SHA256', () => {
    const expected = crypto.createHash('sha256').update('verificare').digest('hex');
    expect(AuthService.hashToken('verificare')).toBe(expected);
  });
});

describe('AuthService.generateRefreshToken', () => {
  it('creează o înregistrare în refresh_tokens cu hash-ul token-ului', async () => {
    const user = await getTestUser();
    const { token, id } = await AuthService.generateRefreshToken(user.id, fakeReq());

    expect(typeof token).toBe('string');
    expect(token.length).toBe(128); // 64 bytes hex

    const record = await prisma.refresh_tokens.findUnique({ where: { id } });
    expect(record).not.toBeNull();
    expect(record.tokenHash).toBe(AuthService.hashToken(token));
    expect(record.userId).toBe(user.id);
    expect(record.revokedAt).toBeNull();

    await prisma.refresh_tokens.delete({ where: { id } });
  });

  it('setează expiresAt la ~7 zile în viitor', async () => {
    const user = await getTestUser();
    const { id } = await AuthService.generateRefreshToken(user.id, fakeReq());
    const record = await prisma.refresh_tokens.findUnique({ where: { id } });

    const days = (record.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    expect(days).toBeGreaterThan(6.9);
    expect(days).toBeLessThan(7.1);

    await prisma.refresh_tokens.delete({ where: { id } });
  });
});

describe('AuthService.login', () => {
  beforeEach(async () => {
    await resetTestUserLock();
  });

  it('returnează accessToken, refreshToken și user la credențiale corecte', async () => {
    const result = await AuthService.login('testuser', TEST_PASSWORD, fakeReq());
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user.username).toBe('testuser');
    expect(result.user).not.toHaveProperty('passwordHash');

    // curăță token-ul de refresh creat
    await prisma.refresh_tokens.deleteMany({
      where: { tokenHash: AuthService.hashToken(result.refreshToken) },
    });
  });

  it('aruncă "Credentiale incorecte" pentru user inexistent', async () => {
    await expect(
      AuthService.login('nu_exista_userul', TEST_PASSWORD, fakeReq())
    ).rejects.toThrow(/Credentiale incorecte/);
  });

  it('aruncă "Credentiale incorecte" pentru parolă greșită', async () => {
    await expect(
      AuthService.login('testuser', 'parola_gresita', fakeReq())
    ).rejects.toThrow(/Credentiale incorecte/);
  });

  it('blochează contul după 5 eșecuri și aruncă "Cont blocat"', async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(TEST_PASSWORD, 12);
    await prisma.users.upsert({
      where: { email: 'svc-lock@simdm.local' },
      update: { isActive: true, failedLoginAttempts: 0, lockedUntil: null, passwordHash: hash },
      create: {
        email: 'svc-lock@simdm.local',
        username: 'svclockuser',
        passwordHash: hash,
        fullName: 'Svc Lock',
        role: 'BIOINGINER',
        isActive: true,
        updatedAt: new Date(),
      },
    });

    for (let i = 0; i < 5; i++) {
      await AuthService.login('svclockuser', 'gresit', fakeReq()).catch(() => {});
    }

    const locked = await prisma.users.findUnique({ where: { email: 'svc-lock@simdm.local' } });
    expect(locked.failedLoginAttempts).toBeGreaterThanOrEqual(5);
    expect(locked.lockedUntil).not.toBeNull();

    await expect(
      AuthService.login('svclockuser', TEST_PASSWORD, fakeReq())
    ).rejects.toThrow(/Cont blocat/);

    await prisma.refresh_tokens.deleteMany({ where: { userId: locked.id } });
    await prisma.audit_logs.deleteMany({ where: { userId: locked.id } });
    await prisma.users.deleteMany({ where: { email: 'svc-lock@simdm.local' } });
  });
});

describe('AuthService.refreshAccessToken', () => {
  beforeEach(async () => {
    await resetTestUserLock();
  });

  it('rotește token-ul: emite token nou și revocă pe cel vechi', async () => {
    const user = await getTestUser();
    const { token: oldToken } = await AuthService.generateRefreshToken(user.id, fakeReq());

    const result = await AuthService.refreshAccessToken(oldToken, fakeReq());
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.refreshToken).not.toBe(oldToken);

    // vechiul token trebuie marcat revokedAt
    const oldRecord = await prisma.refresh_tokens.findUnique({
      where: { tokenHash: AuthService.hashToken(oldToken) },
    });
    expect(oldRecord.revokedAt).not.toBeNull();
    expect(oldRecord.replacedBy).not.toBeNull();

    // curățenie
    await prisma.refresh_tokens.deleteMany({ where: { userId: user.id } });
  });

  it('aruncă pentru un refresh token inexistent', async () => {
    await expect(
      AuthService.refreshAccessToken('token_inexistent_aleator', fakeReq())
    ).rejects.toThrow(/invalid/i);
  });

  it('detectează reutilizarea unui token revocat și aruncă "compromis"', async () => {
    const user = await getTestUser();
    const { token } = await AuthService.generateRefreshToken(user.id, fakeReq());

    // prima rotire — token-ul devine revocat
    await AuthService.refreshAccessToken(token, fakeReq());

    // a doua folosire a aceluiași token (revocat) — semnal de compromis
    await expect(
      AuthService.refreshAccessToken(token, fakeReq())
    ).rejects.toThrow(/compromis/i);

    await prisma.refresh_tokens.deleteMany({ where: { userId: user.id } });
  });

  it('aruncă pentru un refresh token expirat', async () => {
    const user = await getTestUser();
    const rawToken = crypto.randomBytes(64).toString('hex');
    const expired = await prisma.refresh_tokens.create({
      data: {
        id: crypto.randomUUID(),
        tokenHash: AuthService.hashToken(rawToken),
        userId: user.id,
        expiresAt: new Date(Date.now() - 1000), // deja expirat
      },
    });

    await expect(
      AuthService.refreshAccessToken(rawToken, fakeReq())
    ).rejects.toThrow(/expirat/i);

    await prisma.refresh_tokens.delete({ where: { id: expired.id } });
  });
});

describe('AuthService.logout', () => {
  it('revocă refresh token-ul corespunzător', async () => {
    const user = await getTestUser();
    const { token, id } = await AuthService.generateRefreshToken(user.id, fakeReq());

    await AuthService.logout(token, user.id, fakeReq());

    const record = await prisma.refresh_tokens.findUnique({ where: { id } });
    expect(record.revokedAt).not.toBeNull();

    await prisma.refresh_tokens.delete({ where: { id } });
  });

  it('nu aruncă dacă refreshToken lipsește (logout fără cookie)', async () => {
    const user = await getTestUser();
    await expect(
      AuthService.logout(undefined, user.id, fakeReq())
    ).resolves.toBeUndefined();
  });
});

describe('cleanupTokens job — cleanupExpiredTokens', () => {
  const { cleanupExpiredTokens } = require('../jobs/cleanupTokens');
  const crypto = require('crypto');

  it('șterge token-urile expirate și pe cele revocate de peste 7 zile', async () => {
    const user = await getTestUser();

    // Token expirat (trebuie șters)
    const expired = await prisma.refresh_tokens.create({
      data: {
        id: crypto.randomUUID(),
        tokenHash: AuthService.hashToken(crypto.randomBytes(32).toString('hex')),
        userId: user.id,
        expiresAt: new Date(Date.now() - 60 * 1000),
      },
    });

    // Token revocat acum 8 zile (trebuie șters)
    const oldRevoked = await prisma.refresh_tokens.create({
      data: {
        id: crypto.randomUUID(),
        tokenHash: AuthService.hashToken(crypto.randomBytes(32).toString('hex')),
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        revokedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
    });

    // Token valid, activ (NU trebuie șters)
    const active = await prisma.refresh_tokens.create({
      data: {
        id: crypto.randomUUID(),
        tokenHash: AuthService.hashToken(crypto.randomBytes(32).toString('hex')),
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const count = await cleanupExpiredTokens();
    expect(count).toBeGreaterThanOrEqual(2);

    expect(await prisma.refresh_tokens.findUnique({ where: { id: expired.id } })).toBeNull();
    expect(await prisma.refresh_tokens.findUnique({ where: { id: oldRevoked.id } })).toBeNull();
    // token-ul activ rămâne
    expect(await prisma.refresh_tokens.findUnique({ where: { id: active.id } })).not.toBeNull();

    await prisma.refresh_tokens.delete({ where: { id: active.id } });
  });
});
