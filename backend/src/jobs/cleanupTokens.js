const prisma = require('../db');

async function cleanupExpiredTokens() {
  try {
    const result = await prisma.refresh_tokens.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null, lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        ],
      },
    });
    console.log(`[Cleanup] ${result.count} refresh tokens deleted`);
    return result.count;
  } catch (error) {
    console.error('[Cleanup] Error cleaning up expired tokens:', error);
    throw error;
  }
}

module.exports = { cleanupExpiredTokens };
