const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../db');

class AuthService {
  // Generează Access Token (JWT, 15 min)
  static generateAccessToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '15m' }
    );
  }

  // Generează Refresh Token (opac, 7 zile, salvat în DB)
  static async generateRefreshToken(userId, req) {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshToken = await prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(token),
        userId,
        expiresAt,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      },
    });

    console.log(`[AuthService] Refresh token generated for user ${userId}`);
    return token;
  }

  // Hash token cu SHA256
  static hashToken(token) {
    return require('crypto').createHash('sha256').update(token).digest('hex');
  }

  // Login
  static async login(username, password, req) {
    console.log(`[AuthService] Login attempt: ${username}`);

    // Cauta utilizator (username sau email)
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
        isActive: true,
      },
    });

    if (!user) {
      await this.logFailedLogin(username, req, 'USER_NOT_FOUND');
      throw new Error('Credentiale incorecte');
    }

    // Verifica dacă contul este blocat
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil - new Date()) / 60000);
      await this.logFailedLogin(username, req, 'ACCOUNT_LOCKED');
      throw new Error(`Cont blocat. Încearcă peste ${minutesLeft} minute.`);
    }

    // Verifica parola
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      const failedAttempts = user.failedLoginAttempts + 1;
      const updates = { failedLoginAttempts: failedAttempts };

      // După 5 esecuri, blochează 30 min
      if (failedAttempts >= 5) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + 30);
        updates.lockedUntil = lockUntil;
        console.log(`[AuthService] Account locked for ${username} until ${lockUntil}`);
      }

      await prisma.user.update({ where: { id: user.id }, data: updates });
      await this.logFailedLogin(username, req, 'WRONG_PASSWORD');
      throw new Error('Credentiale incorecte');
    }

    // Login reușit — resetează failed attempts
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Generează tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id, req);

    // Audit log
    await prisma.auditLog.create({
      data: {
        user: { connect: { id: user.id } },
        action: 'LOGIN_SUCCESS',
        entity: 'User',
        entityId: user.id.toString(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    console.log(`[AuthService] Login successful for ${username}`);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  // Refresh access token cu rotation
  static async refreshAccessToken(oldRefreshToken, req) {
    console.log(`[AuthService] Refresh token attempt`);

    const tokenHash = this.hashToken(oldRefreshToken);
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!tokenRecord) {
      console.log(`[AuthService] Refresh token not found`);
      throw new Error('Refresh token invalid');
    }

    if (tokenRecord.revokedAt) {
      console.log(`[AuthService] Token revoked - possible compromise!`);
      // Token revocat — posibil compromis! Revocă toate token-urile user-ului
      await prisma.refreshToken.updateMany({
        where: { userId: tokenRecord.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new Error('Token compromis. Re-autentificare necesară.');
    }

    if (tokenRecord.expiresAt < new Date()) {
      console.log(`[AuthService] Token expired`);
      throw new Error('Refresh token expirat');
    }

    // Generează tokens noi (rotation)
    const newAccessToken = this.generateAccessToken(tokenRecord.user);
    const newRefreshToken = await this.generateRefreshToken(tokenRecord.user.id, req);

    // Marcheaza vechiul ca revocat si inlocuit
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: {
        revokedAt: new Date(),
        replacedBy: newRefreshToken,
      },
    });

    console.log(`[AuthService] Token refreshed with rotation for user ${tokenRecord.userId}`);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  // Logout — revocă refresh token
  static async logout(refreshToken, userId, req) {
    console.log(`[AuthService] Logout for user ${userId}`);

    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await prisma.auditLog.create({
      data: {
        user: { connect: { id: userId } },
        action: 'LOGOUT',
        entity: 'User',
        entityId: userId.toString(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
  }

  // Log failed login
  static async logFailedLogin(username, req, reason) {
    await prisma.auditLog.create({
      data: {
        action: 'LOGIN_FAILED',
        entity: 'User',
        changes: { username, reason },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
  }
}

module.exports = AuthService;
