const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../db');

const COOKIE_NAME = 'simdm_refresh';

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_TTL || '15m' }
  );
}

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

async function issueRefreshToken(userId) {
  const raw = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(raw);
  const days = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '30', 10);
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({ data: { tokenHash, userId, expiresAt } });
  return raw;
}

async function rotateRefreshToken(raw) {
  const tokenHash = hashToken(raw);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    throw new Error('Token invalid sau expirat');
  }

  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  const newRaw = await issueRefreshToken(existing.userId);
  return { userId: existing.userId, raw: newRaw };
}

async function revokeRefreshToken(raw) {
  if (!raw) return;
  const tokenHash = hashToken(raw);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

function setRefreshCookie(res, raw) {
  const days = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '30', 10);
  res.cookie(COOKIE_NAME, raw, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge: days * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/api/auth' });
}

function getRefreshFromCookie(req) {
  return req.cookies?.[COOKIE_NAME];
}

module.exports = {
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  getRefreshFromCookie,
};
