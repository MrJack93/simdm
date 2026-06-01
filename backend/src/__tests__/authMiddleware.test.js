/**
 * Teste unitare pentru authMiddleware (src/middleware/auth.js)
 *
 * Middleware-ul este testat izolat, cu req/res/next falsificate.
 * Token-urile sunt generate cu cheia reală JWT_ACCESS_SECRET pentru a
 * reproduce exact comportamentul de producție (HS256, expirare etc.).
 *
 * Coduri de eroare verificate:
 *   401 NO_TOKEN       — lipsă header Authorization sau prefix Bearer
 *   403 TOKEN_INVALID  — semnătură/format invalid
 *   401 TOKEN_EXPIRED  — token expirat
 */
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

const SECRET = process.env.JWT_ACCESS_SECRET;

// Răspuns fals care capturează status + json
function fakeRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function run(headers = {}) {
  const req = { headers };
  const res = fakeRes();
  let nextCalled = false;
  authMiddleware(req, res, () => {
    nextCalled = true;
  });
  return { req, res, nextCalled };
}

describe('authMiddleware — token lipsă', () => {
  it('fără header Authorization -> 401 NO_TOKEN', () => {
    const { res, nextCalled } = run({});
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('NO_TOKEN');
    expect(res.body.error).toMatch(/lips/i);
    expect(nextCalled).toBe(false);
  });

  it('header fără prefix Bearer -> 401 NO_TOKEN', () => {
    const valid = jwt.sign({ sub: 1 }, SECRET);
    const { res, nextCalled } = run({ authorization: valid }); // lipsește "Bearer "
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('NO_TOKEN');
    expect(nextCalled).toBe(false);
  });

  it('prefix greșit (Basic în loc de Bearer) -> 401 NO_TOKEN', () => {
    const { res } = run({ authorization: 'Basic abc123' });
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('NO_TOKEN');
  });
});

describe('authMiddleware — token invalid', () => {
  it('token corupt -> 403 TOKEN_INVALID', () => {
    const { res, nextCalled } = run({ authorization: 'Bearer not.a.jwt' });
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('TOKEN_INVALID');
    expect(nextCalled).toBe(false);
  });

  it('token semnat cu altă cheie -> 403 TOKEN_INVALID', () => {
    const foreign = jwt.sign({ sub: 1 }, 'cheie_straina');
    const { res } = run({ authorization: `Bearer ${foreign}` });
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('TOKEN_INVALID');
  });

  it('token semnat cu algoritm neacceptat -> 403 TOKEN_INVALID', () => {
    // Middleware-ul acceptă doar HS256; un token "none" e respins
    const noneToken =
      Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url') +
      '.' +
      Buffer.from(JSON.stringify({ sub: 1 })).toString('base64url') +
      '.';
    const { res } = run({ authorization: `Bearer ${noneToken}` });
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('TOKEN_INVALID');
  });
});

describe('authMiddleware — token expirat', () => {
  it('token expirat -> 401 TOKEN_EXPIRED', () => {
    const expired = jwt.sign({ sub: 1 }, SECRET, { expiresIn: '-10s' });
    const { res, nextCalled } = run({ authorization: `Bearer ${expired}` });
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('TOKEN_EXPIRED');
    expect(res.body.error).toMatch(/expirat/i);
    expect(nextCalled).toBe(false);
  });
});

describe('authMiddleware — token valid', () => {
  it('apelează next() și populează req.user pentru un token valid', () => {
    const valid = jwt.sign(
      { sub: 42, username: 'testuser', role: 'BIOINGINER' },
      SECRET,
      { expiresIn: '15m' }
    );
    const { req, res, nextCalled } = run({ authorization: `Bearer ${valid}` });
    expect(nextCalled).toBe(true);
    expect(res.statusCode).toBeNull();
    expect(req.user.sub).toBe(42);
    expect(req.user.username).toBe('testuser');
    expect(req.user.role).toBe('BIOINGINER');
  });
});
