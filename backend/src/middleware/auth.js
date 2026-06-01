const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Token lipseşte', code: 'NO_TOKEN' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirat', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ error: 'Token invalid', code: 'TOKEN_INVALID' });
  }
}

// Middleware pentru verificare rol (pentru viitor)
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acces interzis' });
    }
    next();
  };
}

module.exports = authMiddleware;
module.exports.requireRole = requireRole;
