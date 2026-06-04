const express = require('express');
const rateLimit = require('express-rate-limit');
const bcryptjs = require('bcryptjs');
const AuthService = require('../services/authService');
const authMiddleware = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { loginSchema } = require('../schemas/auth.schema');
const prisma = require('../db');

const router = express.Router();

// Rate limiting pentru login (5 incercări / 15 min)
const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 5),
  message: { error: 'Prea multe încercări. Încearcă peste 15 minute.' },
  standardHeaders: true,
  trust: true, // Trust X-Forwarded-For header for correct IP
  skip: (req) => {
    // Skip rate limiting în development cu flag sau în test environment
    if (process.env.NODE_ENV === 'development' && req.query.skip_ratelimit) return true;
    if (process.env.NODE_ENV === 'test') return req.query.skip_ratelimit; // test: only skip with flag
    return false;
  },
});

// Setări cookie pentru refresh token
const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 zile
  path: '/api/auth',
};

// POST /api/auth/login
router.post('/login', loginLimiter, validateBody(loginSchema), async (req, res) => {
  try {
    const { username, password } = req.validated;

    const result = await AuthService.login(username, password, req);

    // Refresh token în httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);

    // Access token în JSON response
    res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    console.error('[Login Error]', error.message);
    res.status(401).json({ error: error.message });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token lipseşte', code: 'NO_REFRESH_TOKEN' });
    }

    const result = await AuthService.refreshAccessToken(refreshToken, req);

    // Setează cookie-ul cu noul refresh token
    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);

    res.json({
      accessToken: result.accessToken,
    });
  } catch (error) {
    console.error('[Refresh Error]', error.message);
    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.status(401).json({ error: error.message });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    await AuthService.logout(refreshToken, req.user.sub, req);

    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.json({ message: 'Logout reușit' });
  } catch (error) {
    console.error('[Logout Error]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me — info utilizator curent
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.sub },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilizator nu găsit' });
    }

    res.json({ user });
  } catch (error) {
    console.error('[Me Error]', error.message);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// PATCH /api/auth/change-password — schimbare parolă
router.patch('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.sub;

    // Validare
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Parolele nu coincid' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Parola nouă trebuie să aibă minim 8 caractere' });
    }

    // Obțineți utilizatorul curent
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, password_hash: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilizator nu găsit' });
    }

    // Verificați parola curentă
    const isPasswordValid = await bcryptjs.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Parolă curentă incorectă' });
    }

    // Hash parola nouă
    const newPasswordHash = await bcryptjs.hash(newPassword, 12);

    // Update parola în baza de date
    await prisma.users.update({
      where: { id: userId },
      data: { password_hash: newPasswordHash },
    });

    // Log audit
    try {
      await prisma.audit_logs.create({
        data: {
          userId,
          action: 'UPDATE',
          entity: 'auth',
          entityId: userId.toString(),
          changes: { action: 'password_changed' },
        },
      });
    } catch (auditError) {
      console.error('Error logging audit:', auditError.message);
    }

    res.json({ message: 'Parolă schimbată cu succes' });
  } catch (error) {
    console.error('[Change Password Error]', error.message);
    res.status(500).json({ error: 'Eroare la schimbarea parolei' });
  }
});

module.exports = router;
