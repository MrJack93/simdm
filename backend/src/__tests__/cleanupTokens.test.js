/**
 * Teste pentru jobul de curățenie a refresh token-urilor
 * (src/jobs/cleanupTokens.js)
 *
 * cleanupExpiredTokens() șterge token-urile expirate sau revocate de peste
 * 7 zile și returnează numărul de rânduri șterse. Eroarea DB este re-aruncată.
 *
 * Calea fericită rulează pe DB-ul real de test (nu lasă efecte secundare —
 * șterge doar token-uri deja expirate). Calea de eroare folosește un spy pe
 * prisma.refresh_tokens.deleteMany pentru a forța o excepție.
 */
const prisma = require('../db');
const { cleanupExpiredTokens } = require('../jobs/cleanupTokens');

describe('cleanupExpiredTokens', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returnează numărul de token-uri șterse (cale fericită)', async () => {
    const count = await cleanupExpiredTokens();
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('șterge un token expirat creat anume pentru test', async () => {
    // userId valid: userul de test creat în setup.js
    const testUser = await prisma.users.findUnique({ where: { email: 'test@simdm.local' } });

    // Creează un token deja expirat -> trebuie eliminat de cleanup
    const uniq = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const expired = await prisma.refresh_tokens.create({
      data: {
        id: `rt-test-${uniq}`,
        tokenHash: `expired-${uniq}`,
        userId: testUser.id,
        expiresAt: new Date(Date.now() - 60 * 1000), // expirat acum un minut
      },
    });

    const count = await cleanupExpiredTokens();
    expect(count).toBeGreaterThanOrEqual(1);

    const stillThere = await prisma.refresh_tokens.findUnique({ where: { id: expired.id } });
    expect(stillThere).toBeNull();
  });

  it('re-aruncă eroarea când deleteMany eșuează (cale de eroare)', async () => {
    const spy = vi
      .spyOn(prisma.refresh_tokens, 'deleteMany')
      .mockRejectedValueOnce(new Error('DB connection lost'));

    await expect(cleanupExpiredTokens()).rejects.toThrow(/DB connection lost/);
    expect(spy).toHaveBeenCalledOnce();
  });
});
